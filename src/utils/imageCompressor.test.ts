import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compressImage } from './imageCompressor';

/** Image factice : se « charge » dès que `src` est affecté, aux dimensions choisies. */
function installFakeImage(width: number, height: number, fail = false): void {
  class FakeImage {
    width = width;
    height = height;
    onload: (() => void) | null = null;
    onerror: ((err: unknown) => void) | null = null;
    set src(_value: string) {
      queueMicrotask(() => (fail ? this.onerror?.(new Error('bad image')) : this.onload?.()));
    }
  }
  vi.stubGlobal('Image', FakeImage);
}

describe('compressImage', () => {
  const drawImage = vi.fn();
  const toDataURL = vi.fn(() => 'data:image/jpeg;base64,COMPRESSED');

  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(toDataURL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    drawImage.mockClear();
    toDataURL.mockClear();
  });

  const file = new File(['abc'], 'tissu.png', { type: 'image/png' });

  it('réduit une image paysage à la largeur maximale en gardant le ratio', async () => {
    installFakeImage(2400, 1200);
    const result = await compressImage(file, 1200, 1200, 0.6);
    expect(result).toBe('data:image/jpeg;base64,COMPRESSED');
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1200, 600);
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.6);
  });

  it('réduit une image portrait à la hauteur maximale', async () => {
    installFakeImage(1000, 3000);
    await compressImage(file, 1200, 1200);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 400, 1200);
  });

  it('n’agrandit pas une petite image', async () => {
    installFakeImage(300, 200);
    await compressImage(file);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 300, 200);
  });

  it('rejette si l’image est illisible', async () => {
    installFakeImage(10, 10, true);
    await expect(compressImage(file)).rejects.toThrow('bad image');
  });
});
