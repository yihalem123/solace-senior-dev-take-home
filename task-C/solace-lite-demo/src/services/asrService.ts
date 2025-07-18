// Vite provides import.meta.env for env variables
export async function transcribeWithEdenAI(audioBlob: Blob): Promise<string> {
  // @ts-ignore
  const apiKey = import.meta.env.VITE_EDENAI_API_KEY;
  if (!apiKey) throw new Error('EdenAI API key not set');

  // Step 1: Launch async job
  const formData = new FormData();
  formData.append('providers', 'amazon'); // switched to amazon for possible free tier support
  formData.append('language', 'en-US');
  formData.append('file', audioBlob, 'audio.wav');

  const endpoint = 'https://api.edenai.run/v2/audio/speech_to_text_async/';
  const launchRes = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData,
  });

  if (!launchRes.ok) {
    const errorText = await launchRes.text();
    console.error('EdenAI ASR launch failed:', {
      endpoint,
      status: launchRes.status,
      errorText,
    });
    throw new Error(`EdenAI ASR launch failed: ${errorText}`);
  }

  const launchData = await launchRes.json();
  const jobId = launchData.job_id;
  if (!jobId) throw new Error('No job_id returned from EdenAI');

  // Step 2: Poll for result
  const pollUrl = `https://api.edenai.run/v2/audio/speech_to_text_async/${jobId}`;
  const start = Date.now();
  while (Date.now() - start < 30000) { // 30s timeout
    await new Promise((res) => setTimeout(res, 2000));
    const pollRes = await fetch(pollUrl, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!pollRes.ok) {
      const pollErrorText = await pollRes.text();
      console.error('EdenAI ASR poll failed:', {
        pollUrl,
        status: pollRes.status,
        pollErrorText,
      });
      continue;
    }
    const pollData = await pollRes.json();
    if (pollData.status === 'finished') {
      // EdenAI returns results per provider, e.g. { amazon: { text: "..." }, ... }
      const transcript = pollData.amazon?.text || '';
      return transcript;
    } else if (pollData.status === 'failed') {
      throw new Error('EdenAI ASR job failed');
    }
  }
  throw new Error('EdenAI ASR job timed out');
}

// OpenAI Whisper fallback
export async function transcribeWithWhisper(audioBlob: Blob): Promise<string> {
  // @ts-ignore
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!openaiKey) throw new Error('OpenAI API key not set');

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI Whisper failed:', {
      status: response.status,
      errorText,
    });
    throw new Error(`OpenAI Whisper failed: ${errorText}`);
  }

  const data = await response.json();
  return data.text || '';
}

// Main ASR function with fallback: try Whisper first, then EdenAI
export async function transcribeWithASRFallback(audioBlob: Blob): Promise<string> {
  try {
    return await transcribeWithWhisper(audioBlob);
  } catch (err: any) {
    // If Whisper fails, fallback to EdenAI
    console.warn('Falling back to EdenAI:', err.message);
    return await transcribeWithEdenAI(audioBlob);
  }
}
