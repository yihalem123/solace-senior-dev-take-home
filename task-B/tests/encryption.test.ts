import { encryptBlob, decryptBlob, generateKey, exportKey, importKey } from '../src/encryption';

describe('encryption module', () => {
  it('should encrypt and decrypt a string with a generated key', async () => {
    const key = await generateKey();
    const plaintext = 'hello world';
    const encrypted = await encryptBlob(plaintext, key);
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.ciphertext).toBeDefined();
    const decrypted = await decryptBlob({ iv: encrypted.iv, ciphertext: encrypted.ciphertext }, key);
    expect(decrypted).toBe(plaintext);
  });

  it('should export and import a key and still decrypt correctly', async () => {
    const key = await generateKey();
    const exported = await exportKey(key);
    const imported = await importKey(exported);
    const plaintext = 'cross-platform test';
    const encrypted = await encryptBlob(plaintext, imported);
    const decrypted = await decryptBlob({ iv: encrypted.iv, ciphertext: encrypted.ciphertext }, imported);
    expect(decrypted).toBe(plaintext);
  });

  it('should generate a new key if not provided and return it', async () => {
    const plaintext = 'auto-key test';
    const encrypted = await encryptBlob(plaintext);
    expect(encrypted.key).toBeDefined();
    const key = await importKey(encrypted.key!);
    const decrypted = await decryptBlob({ iv: encrypted.iv, ciphertext: encrypted.ciphertext }, key);
    expect(decrypted).toBe(plaintext);
  });
}); 