// Cross-platform base64 helpers
function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  let binary = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.byteLength; i++) binary += String.fromCharCode(arr[i]);
  return (typeof btoa !== 'undefined') ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
}

function fromBase64(base64: string): Uint8Array {
  const binary = (typeof atob !== 'undefined') ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

// Helper: Generate AES-GCM 256-bit key
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Helper: Export key to base64
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return toBase64(raw);
}

// Helper: Import key from base64
export async function importKey(base64: string): Promise<CryptoKey> {
  const raw = fromBase64(base64);
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a string using AES-GCM-256
export async function encryptBlob(data: string, key?: CryptoKey): Promise<{ iv: string; ciphertext: string; key?: string }> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const aesKey = key || await generateKey();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(data)
  );
  return {
    iv: toBase64(iv),
    ciphertext: toBase64(encrypted),
    key: key ? undefined : await exportKey(aesKey)
  };
}

// Decrypt a blob using AES-GCM-256
export async function decryptBlob(
  { iv, ciphertext }: { iv: string; ciphertext: string },
  key: CryptoKey
): Promise<string> {
  try {
    console.log('decryptBlob input:', { iv, ciphertext });
    const dec = new TextDecoder();
    const ivBytes = fromBase64(iv);
    const ciphertextBytes = fromBase64(ciphertext);
    console.log('Decoded bytes - IV length:', ivBytes.length, 'Ciphertext length:', ciphertextBytes.length);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      key,
      ciphertextBytes
    );
    console.log('Decrypted bytes length:', decrypted.byteLength);
    
    const result = dec.decode(decrypted);
    console.log('Final decrypted result:', result);
    return result;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Decryption failed: ${error}`);
  }
}

// Export helpers for cross-platform use
export { toBase64, fromBase64 }; 