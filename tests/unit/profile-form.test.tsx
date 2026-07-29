// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Use vi.hoisted() so mock references are available when vi.mock is hoisted
const { updateProfileMock, changePasswordMock, uploadAvatarMock } = vi.hoisted(() => ({
  updateProfileMock: vi.fn(),
  changePasswordMock: vi.fn(),
  uploadAvatarMock: vi.fn(),
}));

vi.mock('@/app/profile/actions', () => ({
  updateProfile: updateProfileMock,
  changePassword: changePasswordMock,
  uploadAvatar: uploadAvatarMock,
}));

vi.mock('@/lib/optimize-image', () => ({
  optimizeImage: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
}));

vi.mock('next/image', () => ({
  default: function MockImage({
    src,
    alt,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
    width?: number;
    height?: number;
  }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} data-testid="next-image" />;
  },
}));

import ProfileForm from '@/components/ProfileForm';

const defaultUser = {
  name: 'John Doe',
  email: 'john@example.com',
  image: null,
};

describe('ProfileForm component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('(a) renders user data correctly', () => {
    render(<ProfileForm user={defaultUser} />);

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Personal Info')).toBeInTheDocument();
    expect(screen.getByText('Avatar')).toBeInTheDocument();
    expect(screen.getAllByText('Change Password').length).toBeGreaterThanOrEqual(1);
  });

  it('(b) submits profile update with new name', async () => {
    const user = userEvent.setup();
    updateProfileMock.mockResolvedValue({ success: true });

    render(<ProfileForm user={defaultUser} />);

    const nameInput = screen.getByDisplayValue('John Doe');
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Doe');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledTimes(1);
    });
  });

  it('(c) submits password change form', async () => {
    const user = userEvent.setup();
    changePasswordMock.mockResolvedValue({ success: true });

    render(<ProfileForm user={defaultUser} />);

    const currentPwdInput = screen.getByLabelText('Current Password');
    const newPwdInput = screen.getByLabelText('New Password');
    const confirmPwdInput = screen.getByLabelText('Confirm New Password');

    await user.type(currentPwdInput, 'oldPass123');
    await user.type(newPwdInput, 'newPass456');
    await user.type(confirmPwdInput, 'newPass456');

    const changeButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changeButton);

    await waitFor(() => {
      expect(changePasswordMock).toHaveBeenCalledTimes(1);
    });
  });

  it('(d) shows error banner on profile update failure', async () => {
    const user = userEvent.setup();
    updateProfileMock.mockRejectedValue(new Error('Failed to update profile.'));

    render(<ProfileForm user={defaultUser} />);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('profile-error')).toHaveTextContent(
        'Failed to update profile.',
      );
    });
  });

  it('(e) shows error banner on password change failure', async () => {
    const user = userEvent.setup();
    changePasswordMock.mockRejectedValue(
      new Error('Current password is incorrect'),
    );

    render(<ProfileForm user={defaultUser} />);

    const currentPwdInput = screen.getByLabelText('Current Password');
    const newPwdInput = screen.getByLabelText('New Password');
    const confirmPwdInput = screen.getByLabelText('Confirm New Password');

    await user.type(currentPwdInput, 'wrongPass');
    await user.type(newPwdInput, 'newPass456');
    await user.type(confirmPwdInput, 'newPass456');

    const changeButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changeButton);

    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toHaveTextContent(
        'Current password is incorrect',
      );
    });
  });

  it('(f) shows success message after profile update', async () => {
    const user = userEvent.setup();
    updateProfileMock.mockResolvedValue({ success: true });

    render(<ProfileForm user={defaultUser} />);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('profile-success')).toBeInTheDocument();
    });
  });
});
