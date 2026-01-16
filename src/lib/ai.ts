export async function askAI(prompt: string, system: string = "Você é um assistente financeiro inteligente e rigoroso.", image?: string) {
  try {
    const baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const apiKey = process.env.OLLAMA_API_KEY;
    const model = process.env.OLLAMA_MODEL || 'gemini-3-flash-preview';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const messages: any[] = [
      { role: 'system', content: system },
    ];

    if (image) {
      messages.push({
        role: 'user',
        content: prompt, // O prompt principal
        images: [image] // Array de imagens em base64
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro na comunicação com a IA');
    }
    
    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('AI Error:', error);
    return null;
  }
}
