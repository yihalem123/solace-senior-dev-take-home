import { decryptBlob, importKey } from './encryption';

function fetchWithTimeout(resource: RequestInfo, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const opts = { ...options, signal: controller.signal };
  return fetch(resource, opts)
    .finally(() => clearTimeout(id));
}

export async function uploadBlob(blob: Blob, apiUrl: string, token: string, timeout = 10000): Promise<string> {
  let res: Response;
  try {
    res = await fetchWithTimeout(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // 'Content-Type' will be set automatically for Blob
      },
      body: blob,
    }, timeout);
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('Upload request timed out');
    throw err;
  }
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.blobKey) {
    throw new Error('No blobKey returned from server');
  }
  return data.blobKey;
}

export async function downloadAndDecrypt(blobKey: string, apiUrl: string, key: CryptoKey, timeout = 10000): Promise<string> {
  let res: Response;
  try {
    console.log('Downloading from:', `${apiUrl}/${blobKey}`);
    res = await fetchWithTimeout(`${apiUrl}/${blobKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, timeout);
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('Download request timed out');
    throw err;
  }
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  console.log('Downloaded data:', data);
  if (!data.iv || !data.ciphertext) {
    throw new Error('Invalid response from server');
  }
  console.log('Decrypting with key:', key);
  try {
    const decrypted = await decryptBlob({ iv: data.iv, ciphertext: data.ciphertext }, key);
    console.log('Decryption result:', decrypted);
    return decrypted;
  } catch (decryptError) {
    console.error('Decryption failed:', decryptError);
    throw new Error(`Decryption failed: ${decryptError}`);
  }
} 