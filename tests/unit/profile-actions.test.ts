import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock server-only (no-op)
vi.mock('server-only', () => ({}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

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

// Mock auth
const getSessionMock = vi.fn();
const updateUserMock = vi.fn();
const changePasswordMock = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: getSessionMock,
      updateUser: updateUserMock,
      changePassword: changePasswordMock,
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

describe('Profile server actions', () => {
  const ORIGINAL_ENV = {
    DATABASE_URL: process.env.DATABASE_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  };

  beforeEach(() => {
    vi.resetModules();
    getSessionMock.mockReset();
    updateUserMock.mockReset();
    changePasswordMock.mockReset();
    cloudinaryUploadMock.mockReset();
    postgresMock.mockReset();

    process.env.DATABASE_URL = 'postgres://user:pass@host/db';
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';

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

  function setupSession() {
    getSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', name: 'John' },
      session: { id: 'session-1' },
    });
  }

  function createMockFile(
    overrides: Partial<{ type: string; size: number; name: string }> = {},
  ): File {
    const type = overrides.type ?? 'image/jpeg';
    const size = overrides.size ?? 1024;
    const name = overrides.name ?? 'avatar.jpg';
    const buffer = new ArrayBuffer(size);
    return new File([buffer], name, { type });
  }

  async function getActions() {
    return import('@/app/profile/actions');
  }

  // ─── updateProfile ──────────────────────────────────────────────

  describe('updateProfile', () => {
    it('(a) updates name successfully', async () => {
      setupSession();
      updateUserMock.mockResolvedValue({});

      const { updateProfile } = await getActions();
      const formData = new FormData();
      formData.set('name', 'Jane Doe');

      const result = await updateProfile(formData);

      expect(result.success).toBe(true);
      expect(updateUserMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { name: 'Jane Doe' },
        }),
      );
    });

    it('(b) rejects empty name', async () => {
      setupSession();

      const { updateProfile } = await getActions();
      const formData = new FormData();
      formData.set('name', '');

      await expect(updateProfile(formData)).rejects.toThrow();
      expect(updateUserMock).not.toHaveBeenCalled();
    });

    it('(c) rejects unauthenticated session', async () => {
      getSessionMock.mockResolvedValue(null);

      const { updateProfile } = await getActions();
      const formData = new FormData();
      formData.set('name', 'Jane Doe');

      await expect(updateProfile(formData)).rejects.toThrow('Not authenticated');
      expect(updateUserMock).not.toHaveBeenCalled();
    });
  });

  // ─── changePassword ─────────────────────────────────────────────

  describe('changePassword', () => {
    it('(d) changes password successfully', async () => {
      setupSession();
      changePasswordMock.mockResolvedValue({});

      const { changePassword } = await getActions();
      const formData = new FormData();
      formData.set('currentPassword', 'oldPassword123');
      formData.set('newPassword', 'newPassword456');
      formData.set('confirmPassword', 'newPassword456');

      const result = await changePassword(formData);

      expect(result.success).toBe(true);
      expect(changePasswordMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            currentPassword: 'oldPassword123',
            newPassword: 'newPassword456',
            revokeOtherSessions: false,
          }),
        }),
      );
    });

    it('(e) rejects incorrect current password', async () => {
      setupSession();
      changePasswordMock.mockRejectedValue(
        new Error('Invalid current password'),
      );

      const { changePassword } = await getActions();
      const formData = new FormData();
      formData.set('currentPassword', 'wrongPassword');
      formData.set('newPassword', 'newPassword456');
      formData.set('confirmPassword', 'newPassword456');

      await expect(changePassword(formData)).rejects.toThrow(
        'Current password is incorrect',
      );
    });

    it('(f) rejects new password shorter than 8 characters', async () => {
      setupSession();

      const { changePassword } = await getActions();
      const formData = new FormData();
      formData.set('currentPassword', 'oldPassword123');
      formData.set('newPassword', 'short');
      formData.set('confirmPassword', 'short');

      await expect(changePassword(formData)).rejects.toThrow();
      expect(changePasswordMock).not.toHaveBeenCalled();
    });

    it('(f2) rejects mismatched password confirmation', async () => {
      setupSession();

      const { changePassword } = await getActions();
      const formData = new FormData();
      formData.set('currentPassword', 'oldPassword123');
      formData.set('newPassword', 'newPassword456');
      formData.set('confirmPassword', 'differentPassword');

      await expect(changePassword(formData)).rejects.toThrow();
      expect(changePasswordMock).not.toHaveBeenCalled();
    });
  });

  // ─── uploadAvatar ───────────────────────────────────────────────

  describe('uploadAvatar', () => {
    it('(g) uploads avatar successfully and returns URL', async () => {
      setupSession();
      updateUserMock.mockResolvedValue({});
      cloudinaryUploadMock.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/avatar.jpg',
      });

      const { uploadAvatar } = await getActions();
      const formData = new FormData();
      formData.set('file', createMockFile());

      const result = await uploadAvatar(formData);

      expect(result.url).toBe(
        'https://res.cloudinary.com/test/image/upload/avatar.jpg',
      );
      expect(updateUserMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            image: 'https://res.cloudinary.com/test/image/upload/avatar.jpg',
          },
        }),
      );
    });

    it('(h) rejects file with invalid MIME type', async () => {
      setupSession();

      const { uploadAvatar } = await getActions();
      const formData = new FormData();
      formData.set(
        'file',
        createMockFile({ type: 'application/pdf', name: 'doc.pdf' }),
      );

      await expect(uploadAvatar(formData)).rejects.toThrow(
        'Invalid file type. Accepted: JPEG, PNG, WEBP, GIF.',
      );
      expect(cloudinaryUploadMock).not.toHaveBeenCalled();
    });

    it('(i) rejects file larger than 2MB', async () => {
      setupSession();

      const { uploadAvatar } = await getActions();
      const formData = new FormData();
      formData.set(
        'file',
        createMockFile({ size: 3 * 1024 * 1024, name: 'huge.jpg' }),
      );

      await expect(uploadAvatar(formData)).rejects.toThrow(
        'File exceeds maximum size of 2MB.',
      );
      expect(cloudinaryUploadMock).not.toHaveBeenCalled();
    });

    it('(j) rejects unauthenticated session', async () => {
      getSessionMock.mockResolvedValue(null);

      const { uploadAvatar } = await getActions();
      const formData = new FormData();
      formData.set('file', createMockFile());

      await expect(uploadAvatar(formData)).rejects.toThrow('Not authenticated');
      expect(cloudinaryUploadMock).not.toHaveBeenCalled();
    });

    it('(k) propagates Cloudinary error as friendly message', async () => {
      setupSession();
      cloudinaryUploadMock.mockRejectedValue(new Error('Cloudinary API error'));

      const { uploadAvatar } = await getActions();
      const formData = new FormData();
      formData.set('file', createMockFile());

      await expect(uploadAvatar(formData)).rejects.toThrow(
        'Failed to upload avatar.',
      );
      expect(updateUserMock).not.toHaveBeenCalled();
    });
  });
});
