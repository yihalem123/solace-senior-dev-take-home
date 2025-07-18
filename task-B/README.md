# Task B: Cross-Platform Client SDK

A comprehensive TypeScript SDK for AES-GCM encryption/decryption, Voice Activity Detection (VAD), secure blob upload/download, and a React demo application.

## 🚀 Features

- **AES-GCM Encryption/Decryption**: Secure cryptographic operations using Web Crypto API
- **Voice Activity Detection (VAD)**: Real-time speech detection using `@ricky0123/vad-web`
- **Secure Blob Operations**: Upload and download encrypted data with abort handling
- **Speech-to-Text**: Web Speech API integration for voice transcription
- **Cross-Platform**: Works in browsers and Node.js environments
- **TypeScript**: Full type safety and IntelliSense support
- **React Demo**: Modern, responsive demo application with glass morphism UI

## 📦 Installation

### Option 1: Local Development Installation

```bash
# Clone the repository
git clone <repository-url>
cd solace-senior-dev-take-home/task-B

# Install SDK dependencies
npm install

# Build the SDK
npm run build

# Install demo dependencies
cd demo
npm install

# Link the SDK locally (for development)
npm link ../

# Return to SDK directory and link
cd ..
npm link
```

### Option 2: Direct Local Installation

```bash
# From the demo directory
cd task-B/demo

# Install the SDK as a local file dependency
npm install ../

# Install demo dependencies
npm install
```

## 🏗️ Project Structure

```
task-B/
├── src/                    # SDK source code
│   ├── encryption.ts      # AES-GCM encryption/decryption
│   ├── vad.ts            # Voice Activity Detection
│   ├── api.ts            # Blob upload/download API
│   └── index.ts          # Main SDK entry point
├── lib/                   # Built SDK (generated)
├── tests/                 # Jest test suite
├── demo/                  # React demo application
│   ├── src/
│   │   └── App.tsx       # Main demo component
│   └── package.json
├── package.json           # SDK package configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## 🔧 API Usage

### Basic SDK Import

```typescript
import { 
  generateKey, 
  exportKey, 
  encryptBlob, 
  decryptBlob,
  uploadBlob,
  downloadAndDecrypt,
  VADProcessor 
} from '@your-org/solace-sdk';
```

### Encryption/Decryption

```typescript
// Generate a new encryption key
const key = await generateKey();

// Export key for storage/transmission
const keyId = await exportKey(key);

// Encrypt data
const data = "Hello, World!";
const encrypted = await encryptBlob(data, key);
// Returns: { iv: string, ciphertext: string }

// Decrypt data
const decrypted = await decryptBlob(encrypted.ciphertext, encrypted.iv, key);
// Returns: "Hello, World!"
```

### Voice Activity Detection

```typescript
// Initialize VAD processor
const vad = new VADProcessor();

// Start VAD with callbacks
await vad.start({
  onSpeechStart: () => console.log('Speech detected'),
  onSpeechEnd: (audioData) => {
    console.log('Speech ended, processing audio...');
    // Process the collected audio data
  },
  onVADMisfire: () => console.log('VAD misfire detected')
});

// Stop VAD
await vad.stop();
```

### Secure Blob Operations

```typescript
// Upload encrypted blob
const encryptedData = new Blob([JSON.stringify(encrypted)]);
const blobKey = await uploadBlob(
  encryptedData, 
  'https://api.example.com/upload',
  'your-api-token'
);

// Download and decrypt
const decryptedText = await downloadAndDecrypt(
  blobKey,
  'https://api.example.com/blob',
  key
);
```

### Speech-to-Text Integration

```typescript
// The demo includes Web Speech API integration
// This automatically transcribes speech to text before encryption

// Speech recognition is handled automatically in the demo
// No additional API calls needed for basic usage
```

## 🎮 Demo Application

### Launch the Demo

```bash
# Navigate to demo directory
cd task-B/demo

# Start the development server
npm start
```

The demo will be available at `http://localhost:3000`

### Demo Features

- **Modern UI**: Glass morphism design with smooth animations
- **Speech Recognition**: Real-time speech-to-text conversion
- **Secure Workflow**: Record → Transcribe → Encrypt → Upload → Download → Decrypt
- **Error Handling**: Comprehensive error messages and validation
- **Microphone Testing**: Built-in microphone access verification

### Demo Workflow

1. **Start Recording**: Click to begin the recording session
2. **Stop & Upload**: Speak into the microphone, then click to:
   - Transcribe your speech to text
   - Encrypt the transcribed text
   - Upload to the secure API
3. **Fetch & Decrypt**: Download and decrypt the text
4. **View Results**: See your original transcribed speech displayed

## 🧪 Testing

### Run SDK Tests

```bash
# From the task-B directory
npm test

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

- **Encryption**: AES-GCM key generation, encryption, decryption
- **VAD**: Voice activity detection start/stop, callbacks
- **API**: Blob upload/download with error handling
- **Integration**: End-to-end workflow testing

## 🔒 Security Features

- **AES-GCM**: Industry-standard authenticated encryption
- **Web Crypto API**: Hardware-accelerated cryptographic operations
- **Secure Key Management**: Keys never leave the client
- **Abort Handling**: Proper cleanup of network requests
- **Input Validation**: Comprehensive data validation

## 🌐 Browser Compatibility

- **Chrome**: 67+ (Web Speech API, Web Crypto API)
- **Firefox**: 60+ (Web Speech API, Web Crypto API)
- **Safari**: 11+ (Web Speech API, Web Crypto API)
- **Edge**: 79+ (Web Speech API, Web Crypto API)

## 📋 Requirements

- **Node.js**: 16+ (for development)
- **npm**: 8+ (for package management)
- **Modern Browser**: With Web Speech API and Web Crypto API support

## 🚀 Deployment

### Build for Production

```bash
# Build the SDK
npm run build

# Build the demo
cd demo
npm run build
```

### Environment Variables

Create a `.env` file in the demo directory:

```env
REACT_APP_API_URL=https://your-api-gateway-url.amazonaws.com
REACT_APP_API_TOKEN=your-api-token
```

## 📝 License

This project is part of the Solace Senior Developer Take-Home Assignment.

## 🤝 Contributing

This is a take-home assignment. For questions or issues, please refer to the assignment documentation.

---

**Note**: This SDK is designed for demonstration purposes and includes comprehensive error handling, logging, and user feedback for educational use. 