import React, { useState, useRef } from 'react';
import { startVAD, stopVAD, VoiceFrame, encryptBlob, generateKey, uploadBlob, downloadAndDecrypt, exportKey } from '@solace/client-sdk';

const glassBg = 'rgba(36, 41, 61, 0.72)';
const glassBorder = '1.5px solid rgba(255,255,255,0.12)';
const glassShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.37)';
const accent = '#4f8cff';
const accent2 = '#2ecc40';
const accent3 = '#ff5e5e';
const textColor = '#f5f6fa';
const muted = '#8b9bb4';
const gradientBg = 'linear-gradient(135deg, #23283a 0%, #2d3250 100%)';

const buttonBase = {
  padding: '0.7em 1.5em',
  border: 'none',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 16,
  cursor: 'pointer',
  transition: 'background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.1s',
  marginRight: 8,
  marginBottom: 8,
  outline: 'none',
  boxShadow: '0 2px 8px 0 #0002',
  backdropFilter: 'blur(2px)',
  WebkitBackdropFilter: 'blur(2px)',
};

// Use the API URL from the .env file
const API_URL = process.env.REACT_APP_SOLACESDK_API_URL!;
const API_TOKEN = 'demo-token'; // TODO: Replace with your real token if needed

const App: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [blobKey, setBlobKey] = useState<string | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // New state for VAD/recording
  const [audioFrames, setAudioFrames] = useState<Float32Array[]>([]);
  const vadInstanceRef = useRef<any>(null);
  const audioRecordingRef = useRef<{ stream: MediaStream; processor: ScriptProcessorNode; source: MediaStreamAudioSourceNode; context: AudioContext } | null>(null);
  // Encryption key (for later)
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [currentKeyId, setCurrentKeyId] = useState<string | null>(null);


  // Handlers
  const handleStartRecording = async () => {
    setError(null);
    setDecryptedText(null);
    setRecording(true);
    setAudioFrames([]);
    try {
      console.log('Starting recording...');
      // For now, just use the working test approach
      console.log('Recording started successfully');
    } catch (err: any) {
      setError('Could not start recording: ' + err.message);
      setRecording(false);
    }
  };

  const handleStopAndUpload = async () => {
    setError(null);
    setLoading(true);
    setRecording(false);
    
    // Wait a moment for cleanup
    setTimeout(async () => {
      try {
        // Use Web Speech API for speech-to-text conversion
        console.log('Starting speech recognition...');
        
        // Check if speech recognition is supported
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          throw new Error('Speech recognition not supported in this browser');
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        let transcribedText = '';
        
        recognition.onresult = (event) => {
          const result = event.results[0];
          transcribedText = result[0].transcript;
          console.log('Transcribed text:', transcribedText);
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setError('Speech recognition failed: ' + event.error);
        };
        
        recognition.onend = async () => {
          if (transcribedText) {
            console.log('Final transcribed text:', transcribedText);
            
            // Generate key and encrypt the transcribed text
            const key = await generateKey();
            setCryptoKey(key);
            const keyId = await exportKey(key);
            setCurrentKeyId(keyId);
            console.log('Generated key for encryption:', keyId);
            
            const encrypted = await encryptBlob(transcribedText, key);
            
            // Upload encrypted blob
            const encryptedBlob = new Blob([
              JSON.stringify({
                iv: encrypted.iv,
                ciphertext: encrypted.ciphertext,
              })
            ], { type: 'application/json' });
            
            // Use the API URL from env
            const uploadedKey = await uploadBlob(encryptedBlob, `${API_URL}/upload`, API_TOKEN);
            setBlobKey(uploadedKey);
            setError(null);
          } else {
            setError('No speech was detected. Please try again and speak clearly.');
          }
          setLoading(false);
        };
        
        // Start recognition
        recognition.start();
        console.log('Speech recognition started. Please speak now...');
        
        // Stop after 5 seconds if no result
        setTimeout(() => {
          if (recognition.state === 'recording') {
            recognition.stop();
          }
        }, 5000);
        
      } catch (err: any) {
        setError('Upload failed: ' + (err.message || err));
        setLoading(false);
      }
    }, 500);
  };

  const handleFetchAndDecrypt = async () => {
    setError(null);
    setLoading(true);
    setDecryptedText(null);
    try {
      if (!blobKey || !cryptoKey) throw new Error('Missing blobKey or key');
      // Use the API URL from env - the downloadAndDecrypt function will append /blob/{blobKey}
      console.log('Fetching blob with key:', blobKey);
      console.log('Using crypto key for decryption:', await exportKey(cryptoKey));
      console.log('Original key used for encryption:', currentKeyId);
      const plaintext = await downloadAndDecrypt(blobKey, `${API_URL}/blob`, cryptoKey);
      console.log('Decrypted text:', plaintext);
      
      // The decrypted text is the transcribed speech
      setDecryptedText(plaintext);
      setError(null);
    } catch (err: any) {
      console.error('Fetch/decrypt error:', err);
      setError('Fetch/decrypt failed: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };



  // Test microphone access and basic audio detection
  const testMicrophone = async () => {
    try {
      console.log('Testing microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted!');
      
      const audioContext = new AudioContext();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('Audio context resumed');
      }
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      let audioDetected = false;
      let frameCount = 0;
      
      processor.onaudioprocess = (event) => {
        frameCount++;
        const input = event.inputBuffer.getChannelData(0);
        const maxAmplitude = Math.max(...input.map(Math.abs));
        
        if (maxAmplitude > 0.01) {
          audioDetected = true;
          console.log(`Frame ${frameCount}: Audio detected! Max amplitude: ${maxAmplitude.toFixed(4)}`);
        }
        
        if (frameCount % 10 === 0) {
          console.log(`Frame ${frameCount}: Max amplitude: ${maxAmplitude.toFixed(4)}`);
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      console.log('Listening for 5 seconds... Speak into the microphone!');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach(track => track.stop());
      
      if (audioDetected) {
        console.log('✅ Microphone test PASSED - Audio was detected!');
        setError(null);
      } else {
        console.log('❌ Microphone test FAILED - No audio detected');
        setError('No audio detected during microphone test. Please check your microphone and speak louder.');
      }
      
    } catch (error) {
      console.error('Microphone test failed:', error);
      setError('Microphone test failed: ' + error);
    }
  };

  // Simple audio recording test (independent of VAD)
  const testAudioRecording = async () => {
    try {
      console.log('Testing basic audio recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      let audioData: Float32Array[] = [];
      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        audioData.push(new Float32Array(input));
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      console.log('Recording for 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach(track => track.stop());
      
      console.log('Basic recording test - frames collected:', audioData.length);
      console.log('Total samples:', audioData.reduce((sum, arr) => sum + arr.length, 0));
      
    } catch (error) {
      console.error('Basic recording test failed:', error);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: gradientBg,
        color: textColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
        padding: 0,
        margin: 0,
        backgroundAttachment: 'fixed',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 430,
          margin: '2rem',
          padding: '2.2rem 1.7rem',
          background: glassBg,
          borderRadius: 22,
          boxShadow: glassShadow,
          border: glassBorder,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <h2 style={{ textAlign: 'center', margin: 0, fontWeight: 700, letterSpacing: 1, color: accent, textShadow: '0 2px 8px #4f8cff33' }}>
          Solace Voice Demo
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <button
            style={{
              ...buttonBase,
              background: recording ? muted : accent,
              color: recording ? '#aaa' : '#fff',
              boxShadow: !recording ? '0 2px 16px 0 #4f8cff55' : 'none',
              pointerEvents: recording || loading ? 'none' : 'auto',
              filter: recording ? 'grayscale(0.5)' : 'none',
            }}
            onClick={handleStartRecording}
            disabled={recording || loading}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Start Recording
          </button>
          <button
            style={{
              ...buttonBase,
              background: !recording ? muted : accent2,
              color: !recording ? '#aaa' : '#fff',
              boxShadow: recording ? '0 2px 16px 0 #2ecc4055' : 'none',
              pointerEvents: !recording || loading ? 'none' : 'auto',
              filter: !recording ? 'grayscale(0.5)' : 'none',
            }}
            onClick={handleStopAndUpload}
            disabled={!recording || loading}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Stop &amp; Upload
          </button>
          <button
            style={{
              ...buttonBase,
              background: !blobKey ? muted : accent3,
              color: !blobKey ? '#aaa' : '#fff',
              boxShadow: blobKey ? '0 2px 16px 0 #ff5e5e55' : 'none',
              pointerEvents: !blobKey || loading ? 'none' : 'auto',
              filter: !blobKey ? 'grayscale(0.5)' : 'none',
            }}
            onClick={handleFetchAndDecrypt}
            disabled={!blobKey || loading}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Fetch &amp; Decrypt
          </button>
          <button
            style={{
              ...buttonBase,
              background: accent,
              color: '#fff',
              boxShadow: '0 2px 16px 0 #4f8cff55',
            }}
            onClick={testMicrophone}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Test Microphone
          </button>
        </div>
        <div style={{ minHeight: 32, marginBottom: 4, textAlign: 'center' }}>
          {loading && <span style={{ color: accent }}>Loading...</span>}
          {error && <span style={{ color: accent3 }}>{error}</span>}
        </div>
        <div
          style={{
            minHeight: 60,
            background: 'rgba(26,30,42,0.85)',
            padding: 18,
            borderRadius: 12,
            color: decryptedText ? textColor : muted,
            fontSize: 17,
            textAlign: 'center',
            wordBreak: 'break-word',
            border: '1.5px solid rgba(255,255,255,0.08)',
            boxShadow: '0 1.5px 8px 0 #0002',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          {decryptedText ? (
            <span>{decryptedText}</span>
          ) : (
            <span>Decrypted text will appear here.</span>
          )}
        </div>

        <div style={{ marginTop: 8, fontSize: 13, color: muted, textAlign: 'center', letterSpacing: 0.2 }}>
          Blob Key: {blobKey || <em>none</em>}
        </div>
      </div>
    </div>
  );
};

export default App;
