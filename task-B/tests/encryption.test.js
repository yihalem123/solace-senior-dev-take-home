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
const encryption_1 = require("../src/encryption");
describe('encryption module', () => {
    it('should encrypt and decrypt a string with a generated key', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = yield (0, encryption_1.generateKey)();
        const plaintext = 'hello world';
        const encrypted = yield (0, encryption_1.encryptBlob)(plaintext, key);
        expect(encrypted.iv).toBeDefined();
        expect(encrypted.ciphertext).toBeDefined();
        const decrypted = yield (0, encryption_1.decryptBlob)({ iv: encrypted.iv, ciphertext: encrypted.ciphertext }, key);
        expect(decrypted).toBe(plaintext);
    }));
    it('should export and import a key and still decrypt correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = yield (0, encryption_1.generateKey)();
        const exported = yield (0, encryption_1.exportKey)(key);
        const imported = yield (0, encryption_1.importKey)(exported);
        const plaintext = 'cross-platform test';
        const encrypted = yield (0, encryption_1.encryptBlob)(plaintext, imported);
        const decrypted = yield (0, encryption_1.decryptBlob)({ iv: encrypted.iv, ciphertext: encrypted.ciphertext }, imported);
        expect(decrypted).toBe(plaintext);
    }));
    it('should generate a new key if not provided and return it', () => __awaiter(void 0, void 0, void 0, function* () {
        const plaintext = 'auto-key test';
        const encrypted = yield (0, encryption_1.encryptBlob)(plaintext);
        expect(encrypted.key).toBeDefined();
        const key = yield (0, encryption_1.importKey)(encrypted.key);
        const decrypted = yield (0, encryption_1.decryptBlob)({ iv: encrypted.iv, ciphertext: encrypted.ciphertext }, key);
        expect(decrypted).toBe(plaintext);
    }));
});
