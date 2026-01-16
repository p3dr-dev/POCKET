export async function askAI(prompt: string, system: string = "Você é um assistente financeiro inteligente e rigoroso.") {
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

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ],
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
