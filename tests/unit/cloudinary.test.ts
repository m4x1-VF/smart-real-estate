import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock server-only (no-op)
vi.mock('server-only', () => ({}));

// Mock cloudinary
const cloudinaryUploadMock = vi.fn();
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: cloudinaryUploadMock,
    },
  },
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock auth
const getSessionMock = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

// Mock postgres-js
const postgresMock = vi.fn();
vi.mock('postgres', () => ({
  default: postgresMock,
}));

// Mock kysely-postgres-js
vi.mock('kysely-postgres-js', () => {
  const noop = vi.fn();
  const mockDriver = {
    init: noop,
    acquireConnection: vi.fn().mockResolvedValue({
      executeQuery: vi.fn().mockResolvedValue({ rows: [], numAffectedRows: BigInt(0) }),
      streamQuery: vi.fn(),
      releaseConnection: vi.fn().mockResolvedValue(undefined),
    }),
    beginTransaction: noop,
    commitTransaction: noop,
    rollbackTransaction: noop,
    destroy: noop,
  };
  const mockQueryCompiler = {
    compileQuery: vi.fn().mockReturnValue({ sql: '', parameters: [] }),
    compileInsert: vi.fn().mockReturnValue({ sql: '', parameters: [] }),
    compileUpdate: vi.fn().mockReturnValue({ sql: '', parameters: [] }),
    compileDelete: vi.fn().mockReturnValue({ sql: '', parameters: [] }),
  };
  return {
    PostgresJSDialect: class MockPostgresJSDialect {
      createDriver() { return mockDriver; }
      createQueryCompiler() { return mockQueryCompiler; }
      createAdapter() { return {}; }
      createIntrospector() {
        return {
          getSchemas: vi.fn().mockResolvedValue([]),
          getTables: vi.fn().mockResolvedValue([]),
          getMetadata: vi.fn().mockResolvedValue({ tables: [] }),
        };
      }
    },
  };
});

// Mock db/properties (used by the same actions.ts module)
vi.mock('@/lib/db/properties', () => ({
  insertProperty: vi.fn(),
  updateProperty: vi.fn(),
  togglePropertyActive: vi.fn(),
}));

describe('uploadImage server action', () => {
  const ORIGINAL_ENV = {
    DATABASE_URL: process.env.DATABASE_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  };

  beforeEach(() => {
    vi.resetModules();
    cloudinaryUploadMock.mockReset();
    getSessionMock.mockReset();
    postgresMock.mockReset();

    process.env.DATABASE_URL = 'postgres://user:pass@host/db';
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';

    // Default: mock getDb() to return admin list with the session user
    const fakeSql = Object.assign(vi.fn(), {
      unsafe: vi.fn(),
      array: vi.fn(),
    });
    postgresMock.mockReturnValue(fakeSql);
  });

  afterEach(() => {
    for (const [key, val] of Object.entries(ORIGINAL_ENV)) {
      if (val === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = val;
      }
    }
    vi.restoreAllMocks();
  });

  function createMockFile(overrides: Partial<{ type: string; size: number; name: string }> = {}): File {
    const type = overrides.type ?? 'image/jpeg';
    const size = overrides.size ?? 1024; // 1 KB
    const name = overrides.name ?? 'test.jpg';
    const buffer = new ArrayBuffer(size);
    return new File([buffer], name, { type });
  }

  async function getUploadAction() {
    const mod = await import('@/app/admin/properties/actions');
    return mod.uploadImage;
  }

  function setupAdminSession() {
    getSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'admin@test.com' },
      session: { id: 'session-1' },
    });

    // Make getDb() return admins list that includes our user
    const fakeSql = Object.assign(
      vi.fn().mockImplementation(async () => [{ email: 'admin@test.com' }]),
      { unsafe: vi.fn(), array: vi.fn() },
    );
    postgresMock.mockReturnValue(fakeSql);
  }

  it('(a) returns secure_url on successful upload', async () => {
    setupAdminSession();
    cloudinaryUploadMock.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v123/test.jpg',
    });

    const uploadImage = await getUploadAction();
    const formData = new FormData();
    formData.set('file', createMockFile());

    const result = await uploadImage(formData);

    expect(result.url).toBe('https://res.cloudinary.com/test-cloud/image/upload/v123/test.jpg');
    expect(cloudinaryUploadMock).toHaveBeenCalledTimes(1);
  });

  it('(b) rejects file with invalid MIME type', async () => {
    setupAdminSession();

    const uploadImage = await getUploadAction();
    const formData = new FormData();
    formData.set('file', createMockFile({ type: 'application/pdf', name: 'doc.pdf' }));

    await expect(uploadImage(formData)).rejects.toThrow(
      'Invalid file type. Accepted: JPEG, PNG, WEBP, GIF.',
    );
    expect(cloudinaryUploadMock).not.toHaveBeenCalled();
  });

  it('(c) rejects file larger than 5MB', async () => {
    setupAdminSession();

    const uploadImage = await getUploadAction();
    const formData = new FormData();
    // 6 MB file
    formData.set('file', createMockFile({ size: 6 * 1024 * 1024, name: 'huge.jpg' }));

    await expect(uploadImage(formData)).rejects.toThrow(
      'File exceeds maximum size of 5MB.',
    );
    expect(cloudinaryUploadMock).not.toHaveBeenCalled();
  });

  it('(d) propagates Cloudinary error message', async () => {
    setupAdminSession();
    cloudinaryUploadMock.mockRejectedValue(new Error('Cloudinary API error'));

    const uploadImage = await getUploadAction();
    const formData = new FormData();
    formData.set('file', createMockFile());

    await expect(uploadImage(formData)).rejects.toThrow(
      'Failed to upload image to Cloudinary.',
    );
  });

  it('(e) rejects unauthenticated session', async () => {
    getSessionMock.mockResolvedValue(null);

    const uploadImage = await getUploadAction();
    const formData = new FormData();
    formData.set('file', createMockFile());

    await expect(uploadImage(formData)).rejects.toThrow('Not authenticated');
    expect(cloudinaryUploadMock).not.toHaveBeenCalled();
  });
});
