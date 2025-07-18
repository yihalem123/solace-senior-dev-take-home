import { useRef, useState } from 'react';
import toWav from 'audiobuffer-to-wav';
import { startVAD, stopVAD } from '../../../../task-B/src/vad';
import type { VoiceFrame } from '../../../../task-B/src/vad';

export function useVoiceCapture() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const vadRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isVADActive, setIsVADActive] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRecorded, setHasRecorded] = useState(false);

  // Start VAD and wait for speech
  const startRecording = async () => {
    setError(null);
    setAudioBlob(null);
    setHasRecorded(false);
    setIsVADActive(true);
    try {
      vadRef.current = await startVAD({
        onSpeechStart: async () => {
          // Start MediaRecorder when speech is detected
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            let options = { mimeType: 'audio/webm' };
            let mediaRecorder: MediaRecorder;
            try {
              mediaRecorder = new window.MediaRecorder(stream, options);
            } catch (e) {
              mediaRecorder = new window.MediaRecorder(stream);
            }
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];
            mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                chunks.push(e.data);
              }
            };
            mediaRecorder.onstop = async () => {
              if (!hasRecorded) {
                const webmBlob = new Blob(chunks, { type: mediaRecorder.mimeType });
                try {
                  const arrayBuffer = await webmBlob.arrayBuffer();
                  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                  const wavBuffer = toWav(audioBuffer);
                  const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
                  setAudioBlob(wavBlob);
                } catch (convErr) {
                  setError('Audio conversion failed');
                  console.error('Audio conversion failed:', convErr);
                }
                setHasRecorded(true);
              }
              stream.getTracks().forEach((track) => track.stop());
            };
            mediaRecorder.start();
            setIsRecording(true);
            setIsVADActive(false);
          } catch (err: any) {
            setError(err.message || 'Microphone access denied');
            setIsVADActive(false);
          }
        },
        onSpeechEnd: () => {
          // Stop MediaRecorder when silence is detected
          if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
          }
          setIsVADActive(false);
        },
      });
    } catch (err: any) {
      setError('VAD failed to start: ' + (err.message || err));
      setIsVADActive(false);
    }
  };

  // Manual stop (fallback)
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (vadRef.current) {
      stopVAD(vadRef.current);
      setIsVADActive(false);
    }
  };

  return {
    isRecording,
    isVADActive,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    setAudioBlob, // for manual reset if needed
  };
}
