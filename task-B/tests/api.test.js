"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const api_1 = require("../src/api");
const encryption_1 = require("../src/encryption");
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
const key = {};
jest.mock('../src/encryption', () => (Object.assign(Object.assign({}, jest.requireActual('../src/encryption')), { decryptBlob: jest.fn().mockResolvedValue('decrypted-text') })));
describe('api helpers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('uploadBlob: should POST blob and return blobKey', () => __awaiter(void 0, void 0, void 0, function* () {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => __awaiter(void 0, void 0, void 0, function* () { return ({ blobKey }); }),
        });
        const result = yield (0, api_1.uploadBlob)(mockBlob, apiUrl, token);
        expect(fetch).toHaveBeenCalledWith(apiUrl, expect.objectContaining({ method: 'POST', body: mockBlob }));
        expect(result).toBe(blobKey);
    }));
    it('uploadBlob: should throw on HTTP error', () => __awaiter(void 0, void 0, void 0, function* () {
        fetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error' });
        yield expect((0, api_1.uploadBlob)(mockBlob, apiUrl, token)).rejects.toThrow('Upload failed: 500 Server Error');
    }));
    it('uploadBlob: should throw on timeout', () => __awaiter(void 0, void 0, void 0, function* () {
        jest.useRealTimers();
        fetch.mockImplementation((_url, opts) => {
            return new Promise((_resolve, reject) => {
                if (opts && opts.signal) {
                    opts.signal.addEventListener('abort', () => {
                        reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
                    });
                }
                // Never resolve, only reject on abort
            });
        });
        yield expect((0, api_1.uploadBlob)(mockBlob, apiUrl, token, 10)).rejects.toThrow('Upload request timed out');
        jest.useFakeTimers();
    }), 10000); // 10s Jest timeout
    it('downloadAndDecrypt: should POST blobKey, call decryptBlob, and return plaintext', () => __awaiter(void 0, void 0, void 0, function* () {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => __awaiter(void 0, void 0, void 0, function* () { return ({ iv: 'iv', ciphertext: 'ct' }); }),
        });
        const result = yield (0, api_1.downloadAndDecrypt)(blobKey, apiUrl, key);
        expect(fetch).toHaveBeenCalledWith(apiUrl, expect.objectContaining({ method: 'POST' }));
        expect(encryption_1.decryptBlob).toHaveBeenCalledWith({ iv: 'iv', ciphertext: 'ct' }, key);
        expect(result).toBe('decrypted-text');
    }));
    it('downloadAndDecrypt: should throw on HTTP error', () => __awaiter(void 0, void 0, void 0, function* () {
        fetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' });
        yield expect((0, api_1.downloadAndDecrypt)(blobKey, apiUrl, key)).rejects.toThrow('Download failed: 404 Not Found');
    }));
    it('downloadAndDecrypt: should throw on timeout', () => __awaiter(void 0, void 0, void 0, function* () {
        jest.useRealTimers();
        fetch.mockImplementation((_url, opts) => {
            return new Promise((_resolve, reject) => {
                if (opts && opts.signal) {
                    opts.signal.addEventListener('abort', () => {
                        reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
                    });
                }
                // Never resolve, only reject on abort
            });
        });
        yield expect((0, api_1.downloadAndDecrypt)(blobKey, apiUrl, key, 10)).rejects.toThrow('Download request timed out');
        jest.useFakeTimers();
    }), 10000); // 10s Jest timeout
});
