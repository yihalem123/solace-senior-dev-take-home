import React, { useState, useRef, useEffect } from 'react';
import { Controls } from './components/Controls';
import { transcribeWithASRFallback } from './services/asrService';
import { getGPTResponse } from './services/gptService';
import { getTTSAudio } from './services/ttsService';
import { VoiceSelector } from './components/VoiceSelector';
import type { VoiceOption } from './components/VoiceSelector';
import { saveConversations, loadConversations, clearConversations } from './services/storageService';
import type { ConversationMemory } from './services/storageService';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [botLoading, setBotLoading] = useState(false);
  const [ttsLoading, setTTSLoading] = useState<string | null>(null); // message text being played
  const [error, setError] = useState<string | null>(null);
  const [voice, setVoice] = useState<VoiceOption>('female');
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load encrypted memory on mount
  useEffect(() => {
    (async () => {
      const convos = await loadConversations();
      if (convos.length > 0) {
        // Flatten to messages array
        const restored: Message[] = [];
        convos.forEach(c => {
          restored.push({ sender: 'user', text: c.user });
          restored.push({ sender: 'bot', text: c.bot });
        });
        setMessages(restored);
      }
    })();
  }, []);

  // Save encrypted memory after each new bot response
  useEffect(() => {
    (async () => {
      // Only save if there are at least one user/bot pair
      const pairs: ConversationMemory[] = [];
      for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].sender === 'user' && messages[i + 1].sender === 'bot') {
          pairs.push({ user: messages[i].text, bot: messages[i + 1].text });
        }
      }
      if (pairs.length > 0) {
        await saveConversations(pairs.slice(-3));
      }
    })();
  }, [messages]);

  const handleAudioReady = async (audio: Blob) => {
    setError(null);
    setLoading(true);
    setMessages((msgs) => [...msgs, { sender: 'user', text: '🎤 (voice message)' }]);
    try {
      const transcript = await transcribeWithASRFallback(audio);
      setMessages((msgs) => [
        ...msgs,
        { sender: 'user', text: transcript || '(no transcript)' },
      ]);
      setBotLoading(true);
      const gptResponse = await getGPTResponse(transcript);
      setMessages((msgs) => [
        ...msgs,
        { sender: 'bot', text: gptResponse || '(no response)' },
      ]);
    } catch (err: any) {
      setError(err.message || 'ASR or GPT failed');
      setMessages((msgs) => [...msgs, { sender: 'bot', text: 'ASR or GPT failed.' }]);
    } finally {
      setLoading(false);
      setBotLoading(false);
    }
  };

  // Play TTS for a bot message
  const handlePlayTTS = async (text: string) => {
    setTTSLoading(text);
    setError(null);
    try {
      const audioBlob = await getTTSAudio(text, voice);
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setTTSLoading(null);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setTTSLoading(null);
        setError('Failed to play audio');
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.play();
    } catch (err: any) {
      setTTSLoading(null);
      setError(err.message || 'TTS failed');
    }
  };

  // Clear history handler
  const handleClearHistory = () => {
    clearConversations();
    setMessages([]);
  };

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, loading, botLoading]);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #181a20 0%, #232a3b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 700,
        height: '92vh',
        background: 'rgba(24,26,32,0.98)',
        borderRadius: 28,
        boxShadow: '0 4px 32px #0008',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(90deg, #4f8cff 0%, #3358ff 100%)', color: 'white', padding: '1.3rem', fontWeight: 700, fontSize: 24, textAlign: 'center', letterSpacing: 1, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, boxShadow: '0 2px 8px #4f8cff33', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Solace Lite Chatbot</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <VoiceSelector value={voice} onChange={setVoice} />
            <button
              onClick={handleClearHistory}
              style={{
                background: 'none',
                border: '1.5px solid #fff',
                color: '#fff',
                borderRadius: 8,
                padding: '6px 14px',
                fontWeight: 500,
                fontSize: 15,
                cursor: 'pointer',
                marginLeft: 8,
                transition: 'background 0.2s, color 0.2s',
              }}
              title="Clear chat history"
            >
              Clear History
            </button>
          </div>
        </div>
        {/* Chat Area */}
        <div style={{
          flex: 1,
          minHeight: 0,
          maxHeight: '100%',
          overflowY: 'auto',
          padding: '1.5rem 1.2rem 2.8rem 1.2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          background: 'rgba(30,32,40,0.98)',
          scrollbarWidth: 'thin',
          msOverflowStyle: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}>
          {messages.length === 0 && (
            <div style={{ color: '#aaa', textAlign: 'center', marginTop: 40, fontSize: 18 }}>
              Tap the mic to start talking!
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                background: msg.sender === 'user'
                  ? 'linear-gradient(135deg, #4f8cff 0%, #3358ff 100%)'
                  : 'linear-gradient(135deg, #232a3b 0%, #232a3b 100%)',
                color: msg.sender === 'user' ? 'white' : '#e0e6f0',
                borderRadius: msg.sender === 'user' ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                padding: '1em 1.4em',
                maxWidth: '80%',
                boxShadow: msg.sender === 'user' ? '0 2px 12px #4f8cff33' : '0 2px 8px #0002',
                fontSize: 18,
                marginBottom: 2,
                wordBreak: 'break-word',
                border: msg.sender === 'user' ? '1.5px solid #4f8cff' : '1.5px solid #232a3b',
                transition: 'background 0.2s, color 0.2s',
                overflowWrap: 'anywhere',
                position: 'relative',
              }}
            >
              {msg.text}
              {msg.sender === 'bot' && msg.text && (
                <button
                  onClick={() => handlePlayTTS(msg.text)}
                  disabled={ttsLoading === msg.text}
                  style={{
                    marginLeft: 12,
                    background: ttsLoading === msg.text ? '#4f8cff33' : '#4f8cff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 20,
                    padding: '6px 18px',
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: ttsLoading === msg.text ? 'not-allowed' : 'pointer',
                    boxShadow: ttsLoading === msg.text ? 'none' : '0 2px 8px #4f8cff22',
                    transition: 'background 0.2s',
                    outline: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  aria-label="Play response"
                  title="Play response"
                >
                  {ttsLoading === msg.text ? (
                    <span style={{ display: 'inline-block', width: 18, height: 18, border: '2.5px solid #fff', borderTop: '2.5px solid #4f8cff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="9" cy="9" r="9" fill="#fff" fillOpacity="0.12" />
                      <polygon points="6,4 14,9 6,14" fill="#fff" />
                    </svg>
                  )}
                  <span style={{ fontWeight: 500, fontSize: 15 }}>{ttsLoading === msg.text ? 'Playing...' : 'Play'}</span>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </button>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', color: '#aaa', fontStyle: 'italic', fontSize: 16 }}>Transcribing...</div>
          )}
          {botLoading && (
            <div style={{ alignSelf: 'flex-start', color: '#4f8cff', fontStyle: 'italic', fontSize: 16 }}>Thinking...</div>
          )}
          {error && <div style={{ color: '#ff6b6b', textAlign: 'center', fontWeight: 500 }}>{error}</div>}
          <div ref={chatEndRef} />
        </div>
        {/* Footer (Mic/Controls) */}
        <div style={{
          flexShrink: 0,
          position: 'relative',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '1.3rem',
          background: 'rgba(24,26,32,0.99)',
          borderTop: '1.5px solid #232a3b',
          display: 'flex',
          justifyContent: 'center',
          zIndex: 2,
        }}>
          <Controls onAudioReady={handleAudioReady} />
        </div>
      </div>
    </div>
  );
}

export default App;
