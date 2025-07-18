import { MicVAD } from '@ricky0123/vad-web';

export type VoiceFrame = Float32Array;

export interface VADOptions {
  onSpeechStart?: () => void;
  onSpeechEnd?: (audio: VoiceFrame) => void;
}

/**
 * Starts voice activity detection using the user's microphone.
 * Calls the provided callbacks on speech start and end.
 * Returns a promise that resolves to a VAD controller with start/pause methods.
 */
export async function startVAD(options: VADOptions = {}) {
  console.log('Starting VAD with options:', options);
  const vad = await MicVAD.new({
    onSpeechStart: () => {
      console.log('VAD onSpeechStart called');
      if (options.onSpeechStart) options.onSpeechStart();
    },
    onSpeechEnd: (audio: VoiceFrame) => {
      console.log('VAD onSpeechEnd called with audio length:', audio.length);
      if (options.onSpeechEnd) options.onSpeechEnd(audio);
    },
    // Add more sensitive VAD settings
    positiveSpeechThreshold: 0.5,
    negativeSpeechThreshold: 0.3,
    frameSamples: 1536,
  });
  console.log('VAD instance created, starting...');
  vad.start();
  console.log('VAD started');
  return vad;
}

/**
 * Stops the given VAD instance.
 */
export function stopVAD(vadInstance: any) {
  vadInstance.pause();
}