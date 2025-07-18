import React from 'react';

export type VoiceOption = 'male' | 'female';

interface VoiceSelectorProps {
  value: VoiceOption;
  onChange: (voice: VoiceOption) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ value, onChange }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <label htmlFor="voice-select" style={{ color: '#e0e6f0', fontWeight: 500, fontSize: 15 }}>
        Voice:
      </label>
      <select
        id="voice-select"
        value={value}
        onChange={e => onChange(e.target.value as VoiceOption)}
        style={{
          background: '#232a3b',
          color: '#fff',
          border: '1.5px solid #4f8cff',
          borderRadius: 8,
          padding: '6px 16px',
          fontSize: 15,
          fontWeight: 500,
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        <option value="female">Female</option>
        <option value="male">Male</option>
      </select>
    </div>
  );
};
