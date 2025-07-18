# Task-C: Solace Lite End-to-End Demo

## Overview
Solace Lite is a minimal, privacy-conscious, voice-to-voice psychiatric companion demo. It captures your voice, transcribes it, chats with you using GPT, and responds with customizable synthesized speech—all in a modern, secure, and user-friendly web app.

---

## Features
- **Voice Capture & VAD:**
  - Tap the mic to start listening. Recording auto-starts/stops based on speech detection (VAD).
- **Accurate Speech-to-Text (ASR):**
  - Uses OpenAI Whisper (with fallback to EdenAI/Amazon if needed) for robust transcription.
- **Psychiatric Chatbot:**
  - Sends your transcript to OpenAI GPT-3.5/4 with a highly empathetic, supportive psychiatric context.
- **Text-to-Speech (TTS):**
  - Converts bot responses to audio using OpenAI TTS (with fallback to AWS Polly). Supports male/female voices.
- **Modern Chat UI:**
  - Beautiful, responsive chat with voice selection, play buttons, scroll-to-latest, and clear history.
- **Encrypted Memory Layer:**
  - Last 3 conversations are encrypted and stored in localStorage using AES-256 (key generated per device).
- **Error Handling:**
  - All errors are surfaced in the UI for transparency.

---

## Setup & Installation

### Prerequisites
- Node.js (>=16.x)
- NPM
- OpenAI API key (for Whisper, GPT, and TTS)
- (Optional) AWS Polly key/region for TTS fallback
- (Optional) EdenAI API key for ASR fallback

### Environment Variables
Create a `.env` file in `task-C/solace-lite-demo` with:

```env
# Required for all core features
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Optional for TTS fallback (AWS Polly)
VITE_AWS_POLLY_KEY=your_aws_polly_key_here
VITE_AWS_POLLY_REGION=us-east-1

# Optional for ASR fallback (EdenAI)
VITE_EDENAI_API_KEY=your_edenai_api_key_here
```

### Install & Run
```sh
cd task-C/solace-lite-demo
npm install
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

---

## Usage
- Tap the mic to start a conversation.
- Speak; the app will auto-record and transcribe your voice.
- The bot will reply in text and you can play the response in your chosen voice.
- Use the "Clear History" button to securely erase all chat and encryption keys.

---

## Architecture Notes
- **Frontend:** React + TypeScript + Vite
- **Voice Activity Detection:** Uses VAD from the local SDK (`task-B`)
- **ASR:** OpenAI Whisper (primary), EdenAI/Amazon (fallback)
- **Chatbot:** OpenAI GPT-3.5/4 with a psychiatric system prompt
- **TTS:** OpenAI TTS (primary), AWS Polly (fallback)
- **Encryption:** AES-256 via SDK, key generated and stored per device
- **Local SDK:** Linked from `task-B` for VAD and encryption

---

## Security & Privacy
- All conversations are encrypted in localStorage with a per-device AES-256 key.
- No data is sent to any backend except for ASR, GPT, and TTS API calls.
- You can clear all data and keys at any time.

---

## Known Issues / Limitations
- ASR and TTS require valid API keys and may incur costs.
- VAD sensitivity may need tuning for noisy environments.
- Local SDK is linked for development; for production, publish and use a versioned package.

---

## How to Test
- Try multiple conversations, clear history, and refresh to see encrypted memory in action.
- Test in different browsers and devices for compatibility.

---

## License
This demo is for technical evaluation and demonstration purposes only. 