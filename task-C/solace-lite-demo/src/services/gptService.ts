export async function getGPTResponse(transcript: string, context: string = ''): Promise<string> {
  // @ts-ignore
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!openaiKey) throw new Error('OpenAI API key not set');

  const messages = [
    {
      role: 'system',
      content:
        context ||
        `You are Solace, a highly empathetic, supportive, and knowledgeable psychiatric voice companion. 
You listen carefully to the user's words, respond with warmth, validation, and encouragement, and offer practical, evidence-based advice for mental health and well-being. 
You never diagnose, but you help users feel heard, safe, and understood. 
Keep your responses concise, conversational, and focused on emotional support, self-care, and positive coping strategies. 
If the user is in crisis, gently encourage them to reach out to a mental health professional or trusted person.`,
    },
    { role: 'user', content: transcript },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 256,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI GPT failed: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}
