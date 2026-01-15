export async function askAI(prompt: string, system: string = "Você é um assistente financeiro inteligente e rigoroso.") {
  try {
    const baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3-flash-preview', // Nome do modelo que você está usando no Ollama
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ],
        stream: false
      }),
    });

    if (!response.ok) throw new Error('Ollama offline ou modelo não encontrado');
    
    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('AI Error:', error);
    return null;
  }
}
