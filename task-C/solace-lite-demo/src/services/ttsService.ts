// OpenAI TTS voices: 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
// We'll map 'male' to 'onyx' and 'female' to 'shimmer' (or similar)

export async function getTTSAudio(text: string, voice: 'male' | 'female' = 'female'): Promise<Blob> {
  // @ts-ignore
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  // @ts-ignore
  const pollyKey = import.meta.env.VITE_AWS_POLLY_KEY;
  // @ts-ignore
  const pollyRegion = import.meta.env.VITE_AWS_POLLY_REGION;

  // OpenAI TTS
  const openaiVoice = voice === 'male' ? 'onyx' : 'shimmer';
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: openaiVoice,
        response_format: 'mp3',
      }),
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const audioBlob = await response.blob();
    return audioBlob;
  } catch (err) {
    // Fallback to AWS Polly
    if (!pollyKey || !pollyRegion) throw new Error('TTS failed and AWS Polly not configured');
    const pollyVoice = voice === 'male' ? 'Matthew' : 'Joanna';
    const pollyEndpoint = `https://polly.${pollyRegion}.amazonaws.com/v1/speech`;
    const pollyHeaders = {
      'Authorization': `Bearer ${pollyKey}`,
      'Content-Type': 'application/json',
    };
    const pollyBody = JSON.stringify({
      OutputFormat: 'mp3',
      Text: text,
      VoiceId: pollyVoice,
      Engine: 'neural',
    });
    const pollyRes = await fetch(pollyEndpoint, {
      method: 'POST',
      headers: pollyHeaders,
      body: pollyBody,
    });
    if (!pollyRes.ok) {
      throw new Error('Both OpenAI TTS and AWS Polly failed: ' + await pollyRes.text());
    }
    return await pollyRes.blob();
  }
}
