import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  sql: vi.fn(),
  insertProperty: vi.fn(),
  updateProperty: vi.fn(),
  togglePropertyActive: vi.fn(),
  uploadImageToCloudinary: vi.fn(),
  isAdmin: vi.fn(),
}));

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mocks.getSession(...args),
    },
  },
}));

vi.mock('@/lib/db/client', () => ({
  getDb: () => mocks.sql,
}));

vi.mock('@/lib/db/properties', () => ({
  insertProperty: (...args: unknown[]) => mocks.insertProperty(...args),
  updateProperty: (...args: unknown[]) => mocks.updateProperty(...args),
  togglePropertyActive: (...args: unknown[]) => mocks.togglePropertyActive(...args),
}));

vi.mock('@/lib/cloudinary', () => ({
  uploadImageToCloudinary: (...args: unknown[]) => mocks.uploadImageToCloudinary(...args),
}));

vi.mock('@/lib/db/admin', () => ({
  isAdmin: (...args: unknown[]) => mocks.isAdmin(...args),
}));

describe('Server actions authorization (T11 → R6)', () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.sql.mockReset();
    mocks.insertProperty.mockReset();
    mocks.updateProperty.mockReset();
    mocks.togglePropertyActive.mockReset();
    mocks.uploadImageToCloudinary.mockReset();
    mocks.isAdmin.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('toggleUserRole', () => {
    it('throws "Not authorized" for non-admin users', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'u1', email: 'user@example.com' },
      });
      mocks.isAdmin.mockResolvedValue(false);

      const { toggleUserRole } = await import('@/app/admin/users/actions');

      await expect(toggleUserRole('u2', 'user')).rejects.toThrow('Not authorized');
      expect(mocks.isAdmin).toHaveBeenCalledWith('u1');
      expect(mocks.sql).not.toHaveBeenCalled();
    });

    it('throws "Not authenticated" when no session', async () => {
      mocks.getSession.mockResolvedValue(null);

      const { toggleUserRole } = await import('@/app/admin/users/actions');

      await expect(toggleUserRole('u2', 'user')).rejects.toThrow('Not authenticated');
    });
  });

  describe('saveProperty', () => {
    it('throws "Not authorized" for non-admin users', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'u1', email: 'user@example.com' },
      });
      mocks.isAdmin.mockResolvedValue(false);

      const { saveProperty } = await import('@/app/admin/properties/actions');

      const formData = new FormData();
      formData.set('title', 'Test Property');

      await expect(saveProperty(formData)).rejects.toThrow('Not authorized');
      expect(mocks.isAdmin).toHaveBeenCalledWith('u1');
      expect(mocks.insertProperty).not.toHaveBeenCalled();
      expect(mocks.updateProperty).not.toHaveBeenCalled();
    });
  });

  describe('togglePropertyActiveAction', () => {
    it('throws "Not authorized" for non-admin users', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'u1', email: 'user@example.com' },
      });
      mocks.isAdmin.mockResolvedValue(false);

      const { togglePropertyActiveAction } = await import('@/app/admin/properties/actions');

      const formData = new FormData();
      formData.set('id', 'p1');
      formData.set('is_active', 'true');

      await expect(togglePropertyActiveAction(formData)).rejects.toThrow('Not authorized');
      expect(mocks.isAdmin).toHaveBeenCalledWith('u1');
      expect(mocks.togglePropertyActive).not.toHaveBeenCalled();
    });
  });

  describe('uploadImage', () => {
    it('throws "Not authorized" for non-admin users', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'u1', email: 'user@example.com' },
      });
      mocks.isAdmin.mockResolvedValue(false);

      const { uploadImage } = await import('@/app/admin/properties/actions');

      const formData = new FormData();
      formData.set('file', new Blob(['test'], { type: 'image/jpeg' }));

      await expect(uploadImage(formData)).rejects.toThrow('Not authorized');
      expect(mocks.isAdmin).toHaveBeenCalledWith('u1');
      expect(mocks.uploadImageToCloudinary).not.toHaveBeenCalled();
    });
  });
});
