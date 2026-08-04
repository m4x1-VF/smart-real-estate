'use client';

import { useState, useRef, FormEvent } from 'react';
import Image from 'next/image';
import {
  updateProfile,
  changePassword,
  uploadAvatar,
} from '@/app/profile/actions';
import { optimizeImage } from '@/lib/optimize-image';
import { generateInitialsAvatar } from '@/lib/utils/avatar';
import {
  updateProfileSchema,
  changePasswordSchema,
} from '@/lib/auth/profile-schemas';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
}

export default function ProfileForm({ user }: ProfileFormProps) {
  // Personal info state
  const [name, setName] = useState(user.name);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(user.image);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // ─── Personal Info ────────────────────────────────────────────
  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    const result = updateProfileSchema.safeParse({ name });
    if (!result.success) {
      setProfileError(result.error.issues[0]?.message ?? 'Invalid name');
      return;
    }

    setProfileLoading(true);
    try {
      const formData = new FormData();
      formData.set('name', name);
      await updateProfile(formData);
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : 'Failed to update profile.',
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // ─── Avatar ───────────────────────────────────────────────────
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = '';

    setAvatarError(null);

    // Client-side validation: MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setAvatarError('Invalid file type. Accepted: JPEG, PNG, WEBP, GIF.');
      return;
    }

    // Client-side validation: size
    if (file.size > MAX_FILE_SIZE) {
      setAvatarError('File exceeds maximum size of 2MB.');
      return;
    }

    setAvatarLoading(true);
    try {
      // Optimize image client-side
      const optimizedBlob = await optimizeImage(file);
      const optimizedFile = new File([optimizedBlob], 'avatar-optimized.jpg', {
        type: 'image/jpeg',
      });

      const formData = new FormData();
      formData.set('file', optimizedFile);

      const result = await uploadAvatar(formData);
      setAvatarUrl(result.url);
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : 'Failed to upload avatar.',
      );
    } finally {
      setAvatarLoading(false);
    }
  };

  // ─── Password ─────────────────────────────────────────────────
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    const result = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!result.success) {
      setPasswordError(result.error.issues[0]?.message ?? 'Validation failed');
      return;
    }

    setPasswordLoading(true);
    try {
      const formData = new FormData();
      formData.set('currentPassword', currentPassword);
      formData.set('newPassword', newPassword);
      formData.set('confirmPassword', confirmPassword);
      await changePassword(formData);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'Failed to change password.',
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const avatarSrc =
    avatarUrl || generateInitialsAvatar(user.name, user.email);

  return (
    <div className="space-y-8">
      {/* ── Section: Personal Info ─────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-linear-to-r from-hint-of-green/10 to-transparent">
          <h2 className="text-xl font-bold text-nordic">Personal Info</h2>
        </div>
        <form onSubmit={handleProfileSubmit} className="p-8 space-y-6">
          {profileError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100" data-testid="profile-error">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100" data-testid="profile-success">
              Profile updated successfully.
            </div>
          )}
          <div>
            <label
              className="block text-sm font-medium text-nordic mb-1.5"
              htmlFor="name"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-base px-4 py-2.5 rounded-md border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all"
              placeholder="Your name"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-nordic mb-1.5"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="text"
              value={user.email}
              disabled
              className="w-full text-base px-4 py-2.5 rounded-md border-gray-200 bg-gray-50 text-nordic/50 cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={profileLoading}
            className="px-6 py-2.5 rounded-lg bg-mosque hover:bg-mosque/90 text-white font-medium shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {profileLoading ? (
              <span className="material-icons animate-spin text-sm">refresh</span>
            ) : (
              <>
                <span className="material-icons text-sm">save</span>
                Save Changes
              </>
            )}
          </button>
        </form>
      </section>

      {/* ── Section: Avatar ────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-linear-to-r from-hint-of-green/10 to-transparent">
          <h2 className="text-xl font-bold text-nordic">Avatar</h2>
        </div>
        <div className="p-8 space-y-6">
          {avatarError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100" data-testid="avatar-error">
              {avatarError}
            </div>
          )}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden ring-2 ring-nordic/10 relative shrink-0">
              <Image
                src={avatarSrc}
                alt="Avatar"
                fill
                sizes="96px"
                className="object-cover"
              />
              {avatarLoading && (
                <div className="absolute inset-0 bg-nordic/50 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="material-icons animate-spin text-white text-2xl">
                    refresh
                  </span>
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
                data-testid="avatar-file-input"
              />
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={avatarLoading}
                className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-nordic font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-icons text-sm">cloud_upload</span>
                Change Avatar
              </button>
              <p className="text-xs text-gray-400 mt-2">
                JPEG, PNG, WEBP or GIF. Max 2 MB.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Change Password ───────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-linear-to-r from-hint-of-green/10 to-transparent">
          <h2 className="text-xl font-bold text-nordic">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordSubmit} className="p-8 space-y-6">
          {passwordError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100" data-testid="password-error">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100" data-testid="password-success">
              Password changed successfully.
            </div>
          )}
          <div>
            <label
              className="block text-sm font-medium text-nordic mb-1.5"
              htmlFor="currentPassword"
            >
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full text-base px-4 py-2.5 rounded-md border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-nordic mb-1.5"
              htmlFor="newPassword"
            >
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full text-base px-4 py-2.5 rounded-md border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-nordic mb-1.5"
              htmlFor="confirmPassword"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full text-base px-4 py-2.5 rounded-md border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="px-6 py-2.5 rounded-lg bg-mosque hover:bg-mosque/90 text-white font-medium shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {passwordLoading ? (
              <span className="material-icons animate-spin text-sm">refresh</span>
            ) : (
              'Change Password'
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
