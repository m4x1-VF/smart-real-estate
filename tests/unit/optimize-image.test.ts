import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { optimizeImage, MAX_DIMENSION, JPEG_QUALITY } from '@/lib/optimize-image';

describe('optimizeImage', () => {
  // Track mocks for cleanup
  let mockDrawImage: ReturnType<typeof vi.fn>;
  let mockConvertToBlob: ReturnType<typeof vi.fn>;
  let mockGetContext: ReturnType<typeof vi.fn>;
  let mockCreateImageBitmap: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDrawImage = vi.fn();
    mockConvertToBlob = vi.fn();
    mockGetContext = vi.fn().mockReturnValue({ drawImage: mockDrawImage });

    // Mock OffscreenCanvas
    vi.stubGlobal(
      'OffscreenCanvas',
      class MockOffscreenCanvas {
        width: number;
        height: number;

        constructor(width: number, height: number) {
          this.width = width;
          this.height = height;
        }

        getContext(type: string) {
          return mockGetContext(type);
        }

        convertToBlob(options?: { type?: string; quality?: number }) {
          return mockConvertToBlob(options);
        }
      },
    );

    // Mock createImageBitmap
    mockCreateImageBitmap = vi.fn();
    vi.stubGlobal('createImageBitmap', mockCreateImageBitmap);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function createMockFile(name = 'test.jpg', type = 'image/jpeg'): File {
    const buffer = new ArrayBuffer(1024);
    return new File([buffer], name, { type });
  }

  function setupBitmap(width: number, height: number) {
    mockCreateImageBitmap.mockResolvedValue({
      width,
      height,
      close: vi.fn(),
    });
  }

  function setupConvertToBlobReturns(mimeType = 'image/jpeg') {
    mockConvertToBlob.mockResolvedValue(
      new Blob(['fake-image-data'], { type: mimeType }),
    );
  }

  it('(a) resizes 4000x3000 image to 1920x1440', async () => {
    setupBitmap(4000, 3000);
    setupConvertToBlobReturns();

    await optimizeImage(createMockFile());

    // longest side = 4000, scale = 1920/4000 = 0.48
    // width = 4000 * 0.48 = 1920, height = 3000 * 0.48 = 1440
    expect(mockCreateImageBitmap).toHaveBeenCalledTimes(1);

    // Verify OffscreenCanvas was created with correct dimensions
    // We can check drawImage was called with the right output dimensions
    expect(mockDrawImage).toHaveBeenCalledWith(
      expect.any(Object),
      0,
      0,
      1920,
      1440,
    );
  });

  it('(b) does not resize 1920x1080 image', async () => {
    setupBitmap(1920, 1080);
    setupConvertToBlobReturns();

    await optimizeImage(createMockFile());

    // Max dimension is exactly 1920, no scaling needed
    expect(mockDrawImage).toHaveBeenCalledWith(
      expect.any(Object),
      0,
      0,
      1920,
      1080,
    );
  });

  it('(c) does not resize 800x600 image', async () => {
    setupBitmap(800, 600);
    setupConvertToBlobReturns();

    await optimizeImage(createMockFile());

    // Both dimensions under 1920, no scaling
    expect(mockDrawImage).toHaveBeenCalledWith(
      expect.any(Object),
      0,
      0,
      800,
      600,
    );
  });

  it('(d) calls convertToBlob with image/jpeg and 0.85 quality', async () => {
    setupBitmap(800, 600);
    setupConvertToBlobReturns();

    await optimizeImage(createMockFile());

    expect(mockConvertToBlob).toHaveBeenCalledTimes(1);
    expect(mockConvertToBlob).toHaveBeenCalledWith({
      type: 'image/jpeg',
      quality: 0.85,
    });
  });

  it('(e) returned Blob has type image/jpeg', async () => {
    setupBitmap(800, 600);
    setupConvertToBlobReturns('image/jpeg');

    const result = await optimizeImage(createMockFile());

    expect(result.type).toBe('image/jpeg');
  });

  it('(f) throws error when convertToBlob returns null', async () => {
    setupBitmap(800, 600);
    // Simulate convertToBlob returning null (canvas error)
    mockConvertToBlob.mockResolvedValue(null);

    await expect(optimizeImage(createMockFile())).rejects.toThrow(
      'Image optimization failed: canvas returned null',
    );
  });

  it('exports MAX_DIMENSION = 1920', () => {
    expect(MAX_DIMENSION).toBe(1920);
  });

  it('exports JPEG_QUALITY = 0.85', () => {
    expect(JPEG_QUALITY).toBe(0.85);
  });

  it('closes the bitmap after drawing', async () => {
    const closeFn = vi.fn();
    mockCreateImageBitmap.mockResolvedValue({
      width: 800,
      height: 600,
      close: closeFn,
    });
    setupConvertToBlobReturns();

    await optimizeImage(createMockFile());

    expect(closeFn).toHaveBeenCalledTimes(1);
  });

  it('handles portrait images correctly (height > width)', async () => {
    setupBitmap(1000, 3000);
    setupConvertToBlobReturns();

    await optimizeImage(createMockFile());

    // longest side = 3000 (height), scale = 1920/3000 = 0.64
    // width = 1000 * 0.64 = 640, height = 3000 * 0.64 = 1920
    expect(mockDrawImage).toHaveBeenCalledWith(
      expect.any(Object),
      0,
      0,
      640,
      1920,
    );
  });
});
