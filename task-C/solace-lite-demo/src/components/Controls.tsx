import React, { useRef } from 'react';
import { useVoiceCapture } from '../hooks/useVoiceCapture';

interface ControlsProps {
  onAudioReady?: (audio: Blob) => void;
}

const MicIcon: React.FC<{ recording: boolean }> = ({ recording }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill={recording ? '#e74c3c' : '#232a3b'} style={{ transition: 'fill 0.2s' }} />
    <rect x="15" y="10" width="10" height="16" rx="5" fill={recording ? '#fff' : '#4f8cff'} />
    <rect x="17.5" y="26" width="5" height="6" rx="2.5" fill={recording ? '#fff' : '#4f8cff'} />
    <rect x="12" y="32" width="16" height="3" rx="1.5" fill={recording ? '#fff' : '#4f8cff'} />
    {recording && (
      <circle cx="20" cy="20" r="18" stroke="#e74c3c" strokeWidth="2" fill="none" style={{ opacity: 0.5, animation: 'pulse 1.2s infinite' }} />
    )}
    <style>{`
      @keyframes pulse {
        0% { opacity: 0.5; r: 18; }
        50% { opacity: 0.2; r: 20; }
        100% { opacity: 0.5; r: 18; }
      }
    `}</style>
  </svg>
);

export const Controls: React.FC<ControlsProps> = ({ onAudioReady }) => {
  const { isRecording, isVADActive, audioBlob, error, startRecording, stopRecording, setAudioBlob } = useVoiceCapture();
  const hasSentRef = useRef(false);

  React.useEffect(() => {
    if (audioBlob && onAudioReady && !hasSentRef.current) {
      hasSentRef.current = true;
      onAudioReady(audioBlob);
      setAudioBlob(null); // Reset after sending
    }
    if (!audioBlob) {
      hasSentRef.current = false;
    }
  }, [audioBlob, onAudioReady, setAudioBlob]);

  // Reset state on each new recording
  React.useEffect(() => {
    if (!isRecording) {
      setAudioBlob(null);
      hasSentRef.current = false;
    }
  }, [isRecording, setAudioBlob]);

  const handleRecordClick = () => {
    if (isRecording || isVADActive) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1rem 0' }}>
      <button
        onClick={handleRecordClick}
        style={{
          background: 'none',
          border: 'none',
          borderRadius: '50%',
          width: 80,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isRecording ? '0 0 24px #e74c3c88' : '0 2px 8px #4f8cff33',
          cursor: 'pointer',
          outline: 'none',
          transition: 'box-shadow 0.2s',
        }}
        aria-label={isRecording || isVADActive ? 'Stop recording' : 'Start recording'}
      >
        <MicIcon recording={isRecording || isVADActive} />
      </button>
      <div style={{ marginTop: 12, color: isRecording ? '#e74c3c' : isVADActive ? '#ffb347' : '#4f8cff', fontWeight: 500, fontSize: 16 }}>
        {isRecording
          ? 'Recording...'
          : isVADActive
          ? 'Listening for speech...'
          : 'Tap to record'}
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </div>
  );
};
