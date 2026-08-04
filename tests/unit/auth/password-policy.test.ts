import { describe, expect, it } from 'vitest';
import { signupSchema } from '@/lib/auth/schemas';
import { changePasswordSchema } from '@/lib/auth/profile-schemas';

const VALID_PASSWORD = 'Abcdef1!';

const baseSignupInput = {
  name: 'John Doe',
  email: 'john@example.com',
  confirmPassword: VALID_PASSWORD,
};

const baseChangePasswordInput = {
  currentPassword: 'OldPassword1!',
  confirmPassword: VALID_PASSWORD,
};

describe('signupSchema — password policy', () => {
  it('accepts a password that meets all complexity rules', () => {
    const result = signupSchema.safeParse({
      ...baseSignupInput,
      password: VALID_PASSWORD,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = signupSchema.safeParse({
      ...baseSignupInput,
      password: 'Ab1!xyz',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message);
      expect(messages).toContain('Password must be at least 8 characters');
    }
  });

  it('rejects a password without an uppercase letter', () => {
    const result = signupSchema.safeParse({
      ...baseSignupInput,
      password: 'abcdefg1!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message);
      expect(messages).toContain(
        'Password must contain at least one uppercase letter'
      );
    }
  });

  it('rejects a password without a lowercase letter', () => {
    const result = signupSchema.safeParse({
      ...baseSignupInput,
      password: 'ABCDEFG1!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message);
      expect(messages).toContain(
        'Password must contain at least one lowercase letter'
      );
    }
  });

  it('rejects a password without a digit', () => {
    const result = signupSchema.safeParse({
      ...baseSignupInput,
      password: 'Abcdefgh!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message);
      expect(messages).toContain(
        'Password must contain at least one digit'
      );
    }
  });

  it('rejects a password without a special character', () => {
    const result = signupSchema.safeParse({
      ...baseSignupInput,
      password: 'Abcdefg1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message);
      expect(messages).toContain(
        'Password must contain at least one special character'
      );
    }
  });
});

describe('changePasswordSchema — password policy', () => {
  it('accepts a new password that meets all complexity rules', () => {
    const result = changePasswordSchema.safeParse({
      ...baseChangePasswordInput,
      newPassword: VALID_PASSWORD,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a new password shorter than 8 characters', () => {
    const result = changePasswordSchema.safeParse({
      ...baseChangePasswordInput,
      newPassword: 'Ab1!xyz',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a new password without an uppercase letter', () => {
    const result = changePasswordSchema.safeParse({
      ...baseChangePasswordInput,
      newPassword: 'abcdefg1!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a new password without a lowercase letter', () => {
    const result = changePasswordSchema.safeParse({
      ...baseChangePasswordInput,
      newPassword: 'ABCDEFG1!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a new password without a digit', () => {
    const result = changePasswordSchema.safeParse({
      ...baseChangePasswordInput,
      newPassword: 'Abcdefgh!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a new password without a special character', () => {
    const result = changePasswordSchema.safeParse({
      ...baseChangePasswordInput,
      newPassword: 'Abcdefg1',
    });
    expect(result.success).toBe(false);
  });
});
