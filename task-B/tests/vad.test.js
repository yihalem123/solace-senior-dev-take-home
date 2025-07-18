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
const vad_1 = require("../src/vad");
// Mock @ricky0123/vad-web
jest.mock('@ricky0123/vad-web', () => {
    return {
        MicVAD: {
            new: jest.fn().mockImplementation((opts) => __awaiter(void 0, void 0, void 0, function* () {
                return {
                    start: jest.fn(() => {
                        if (opts.onSpeechStart)
                            opts.onSpeechStart();
                        if (opts.onSpeechEnd)
                            opts.onSpeechEnd(new Float32Array([1, 2, 3]));
                    }),
                    pause: jest.fn(),
                };
            })),
        },
    };
});
describe('VAD module (browser-compatible)', () => {
    it('should call onSpeechStart and onSpeechEnd callbacks and return a controller', () => __awaiter(void 0, void 0, void 0, function* () {
        const onSpeechStart = jest.fn();
        const onSpeechEnd = jest.fn();
        const vad = yield (0, vad_1.startVAD)({ onSpeechStart, onSpeechEnd });
        expect(vad).toBeDefined();
        expect(typeof vad.start).toBe('function');
        expect(typeof vad.pause).toBe('function');
        // startVAD should have triggered the callbacks
        expect(onSpeechStart).toHaveBeenCalled();
        expect(onSpeechEnd).toHaveBeenCalledWith(expect.any(Float32Array));
        // Test stopVAD
        (0, vad_1.stopVAD)(vad);
        expect(vad.pause).toHaveBeenCalled();
    }));
});
