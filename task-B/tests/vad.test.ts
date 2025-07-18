/**
 * @jest-environment jsdom
 */
import { startVAD, stopVAD, VoiceFrame } from '../src/vad';

// Mock @ricky0123/vad-web
jest.mock('@ricky0123/vad-web', () => {
  return {
    MicVAD: {
      new: jest.fn().mockImplementation(async (opts: any) => {
        return {
          start: jest.fn(() => {
            if (opts.onSpeechStart) opts.onSpeechStart();
            if (opts.onSpeechEnd) opts.onSpeechEnd(new Float32Array([1, 2, 3]));
          }),
          pause: jest.fn(),
        };
      }),
    },
  };
});

describe('VAD module (browser-compatible)', () => {
  it('should call onSpeechStart and onSpeechEnd callbacks and return a controller', async () => {
    const onSpeechStart = jest.fn();
    const onSpeechEnd = jest.fn();
    const vad = await startVAD({ onSpeechStart, onSpeechEnd });
    expect(vad).toBeDefined();
    expect(typeof vad.start).toBe('function');
    expect(typeof vad.pause).toBe('function');
    // startVAD should have triggered the callbacks
    expect(onSpeechStart).toHaveBeenCalled();
    expect(onSpeechEnd).toHaveBeenCalledWith(expect.any(Float32Array));
    // Test stopVAD
    stopVAD(vad);
    expect(vad.pause).toHaveBeenCalled();
  });
});
