# Solace Senior Dev Take-Home Assignment

Welcome to the Solace Senior Dev Take-Home! This repository contains three distinct tasks, each demonstrating secure, modern, and cross-platform development skills for a voice-based psychiatric companion system.

---

## Repository Structure

```
solace-senior-dev-take-home/
├── task-A/   # Enclave-Style Decryption Service (Python, AWS Lambda)
├── task-B/   # Cross-Platform Client SDK (TypeScript/JS, encryption, VAD)
├── task-C/   # Solace Lite End-to-End Demo (React, Vite, GPT, TTS)
├── README.md # (this file)
├── .env.example
└── ...
```

---

## Task Overview

### **Task A: Enclave-Style Decryption Service**
- **Goal:** Emulate a Trusted Execution Environment (TEE) using AWS Lambda + KMS for secure "data in use" decryption.
- **Features:**
  - Lambda handler receives a blobKey (S3 object key) via HTTP POST.
  - Fetches encrypted blob from S3, decrypts with AWS KMS (Lambda-only IAM policy).
  - Returns plaintext JSON over HTTPS with CORS.
  - Infrastructure as Code (Terraform or AWS SAM): Lambda, KMS, S3, API Gateway.
  - Security best practices: least-privilege IAM, S3 encryption, env vars for config.
  - End-to-end test script and sample encrypted blob.
- **Key Files:**
  - `task-A/src/handler.py` (Lambda handler)
  - `task-A/infra/` (Terraform/SAM templates)
  - `task-A/README.md` (setup, deployment, curl example)

---

### **Task B: Cross-Platform Client SDK**
- **Goal:** Build `@solace/client-sdk` for secure blob encryption and VAD-based audio capture.
- **Features:**
  - AES-GCM 256 encryption/decryption (Web Crypto API)
  - Voice Activity Detection (VAD) using webrtcvad.js or equivalent
  - Upload/download helpers for Task A endpoint
  - Minimal React/React Native demo app
  - Unit tests for encryption, VAD, and API helpers
- **Key Files:**
  - `task-B/src/encryption.ts` (crypto helpers)
  - `task-B/src/vad.ts` (VAD logic)
  - `task-B/src/api.ts` (upload/download helpers)
  - `task-B/demo/` (React demo app)
  - `task-B/README.md` (API usage, install, demo)

---

### **Task C: Solace Lite End-to-End Demo**
- **Goal:** Prototype a minimal voice-to-voice psychiatric companion with chat and voice customization.
- **Features:**
  - Voice capture with VAD (auto start/stop)
  - ASR (OpenAI Whisper primary, EdenAI/Amazon fallback)
  - GPT-3.5/4 chatbot with psychiatric context
  - TTS (OpenAI, fallback to AWS Polly), voice selection (male/female)
  - Modern chat UI: scroll, play buttons, clear history, voice selection
  - Encrypted memory layer (last 3 conversations, AES-256, localStorage)
  - Error handling, local SDK integration
- **Key Files:**
  - `task-C/solace-lite-demo/` (full React+Vite app)
  - `task-C/README.md` (detailed setup, env, usage)

---

## Prerequisites
- Node.js (>=16.x)
- Python (>=3.9) for Task A
- AWS CLI, Docker, Git, Terraform or AWS SAM CLI (for Task A infra)
- OpenAI API key (for Task C)
- (Optional) AWS and EdenAI keys for full demo

---

## How to Run Each Task

### Task A
- See `task-A/README.md` for Lambda deployment, infra setup, and test instructions.

### Task B
- See `task-B/README.md` for SDK usage, API docs, and demo app instructions.

### Task C
- See `task-C/README.md` for full end-to-end demo setup, environment variables, and usage.

---

## Submission Checklist
- [x] All code, infra, and tests included for each task
- [x] Each task has a dedicated README with setup and usage
- [x] No secrets or sensitive data in repo (see `.env.example`)
- [x] Demo accessible at http://localhost:3000 (Task C)

---

## Contact & Support
**Yihalem Mandefro**  
📧 Email: [yihalemmande123@gmail.com](mailto:yihalemmande123@gmail.com)  
🔗 LinkedIn: [linkedin.com/in/yihalemm](https://linkedin.com/in/yihalemm)

For any questions, please refer to the individual task READMEs or contact me directly.

 