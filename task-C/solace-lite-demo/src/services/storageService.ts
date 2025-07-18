import { encryptBlob, decryptBlob, generateKey, importKey, exportKey } from '../../../../task-B/src/encryption';

const STORAGE_KEY = 'solace_encrypted_conversations';
const KEY_STORAGE_KEY = 'solace_demo_key';

async function getDemoKey(): Promise<CryptoKey> {
  let keyB64 = localStorage.getItem(KEY_STORAGE_KEY);
  if (!keyB64) {
    const key = await generateKey();
    keyB64 = await exportKey(key);
    localStorage.setItem(KEY_STORAGE_KEY, keyB64);
    return key;
  }
  return importKey(keyB64);
}

export interface ConversationMemory {
  user: string;
  bot: string;
}

export async function saveConversations(convos: ConversationMemory[]) {
  const key = await getDemoKey();
  const data = JSON.stringify(convos.slice(-3));
  const encrypted = await encryptBlob(data, key);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
}

export async function loadConversations(): Promise<ConversationMemory[]> {
  const key = await getDemoKey();
  const encryptedStr = localStorage.getItem(STORAGE_KEY);
  if (!encryptedStr) return [];
  try {
    const encrypted = JSON.parse(encryptedStr);
    const decrypted = await decryptBlob(encrypted, key);
    return JSON.parse(decrypted);
  } catch {
    return [];
  }
}

export function clearConversations() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(KEY_STORAGE_KEY);
}
