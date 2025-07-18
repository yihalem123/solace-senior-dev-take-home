/**
 * @jest-environment jsdom
 */
import { uploadBlob, downloadAndDecrypt } from '../src/api';
import { decryptBlob } from '../src/encryption';

// Polyfill AbortController if not available (Node.js env)
if (typeof global.AbortController === 'undefined') {
  // @ts-ignore
  global.AbortController = require('abort-controller');
}

// Mock global fetch
global.fetch = jest.fn();

const mockBlob = new Blob(['test']);
const apiUrl = 'https://api.example.com/decrypt';
const token = 'test-token';
const blobKey = 'abc123';
const key = {} as CryptoKey;

jest.mock('../src/encryption', () => ({
  ...jest.requireActual('../src/encryption'),
  decryptBlob: jest.fn().mockResolvedValue('decrypted-text'),
}));

describe('api helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploadBlob: should POST blob and return blobKey', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ blobKey }),
    });
    const result = await uploadBlob(mockBlob, apiUrl, token);
    expect(fetch).toHaveBeenCalledWith(apiUrl, expect.objectContaining({ method: 'POST', body: mockBlob }));
    expect(result).toBe(blobKey);
  });

  it('uploadBlob: should throw on HTTP error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error' });
    await expect(uploadBlob(mockBlob, apiUrl, token)).rejects.toThrow('Upload failed: 500 Server Error');
  });

  it('uploadBlob: should throw on timeout', async () => {
    jest.useRealTimers();
    (fetch as jest.Mock).mockImplementation((_url, opts) => {
      return new Promise((_resolve, reject) => {
        if (opts && opts.signal) {
          opts.signal.addEventListener('abort', () => {
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
          });
        }
        // Never resolve, only reject on abort
      });
    });
    await expect(uploadBlob(mockBlob, apiUrl, token, 10)).rejects.toThrow('Upload request timed out');
    jest.useFakeTimers();
  }, 10000); // 10s Jest timeout

  it('downloadAndDecrypt: should POST blobKey, call decryptBlob, and return plaintext', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ iv: 'iv', ciphertext: 'ct' }),
    });
    const result = await downloadAndDecrypt(blobKey, apiUrl, key);
    expect(fetch).toHaveBeenCalledWith(apiUrl, expect.objectContaining({ method: 'POST' }));
    expect(decryptBlob).toHaveBeenCalledWith({ iv: 'iv', ciphertext: 'ct' }, key);
    expect(result).toBe('decrypted-text');
  });

  it('downloadAndDecrypt: should throw on HTTP error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' });
    await expect(downloadAndDecrypt(blobKey, apiUrl, key)).rejects.toThrow('Download failed: 404 Not Found');
  });

  it('downloadAndDecrypt: should throw on timeout', async () => {
    jest.useRealTimers();
    (fetch as jest.Mock).mockImplementation((_url, opts) => {
      return new Promise((_resolve, reject) => {
        if (opts && opts.signal) {
          opts.signal.addEventListener('abort', () => {
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
          });
        }
        // Never resolve, only reject on abort
      });
    });
    await expect(downloadAndDecrypt(blobKey, apiUrl, key, 10)).rejects.toThrow('Download request timed out');
    jest.useFakeTimers();
  }, 10000); // 10s Jest timeout
});
