import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import userService from '../services/userService';
import type { ApiError } from '../types';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({
    email: user?.email || '',
    username: user?.username || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    setProfileForm({
      email: user?.email || '',
      username: user?.username || '',
    });
  }, [user]);

  const getApiErrorMessage = (err: unknown, fallback: string) => {
    const apiError = err as { response?: { data?: ApiError } };
    return apiError.response?.data?.error || apiError.response?.data?.message || fallback;
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsSavingProfile(true);

    try {
      await userService.updateProfile({
        email: profileForm.email.trim(),
        username: profileForm.username.trim(),
      });
      await refreshProfile();
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(getApiErrorMessage(err, 'Unable to update your profile.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsSavingPassword(true);
    try {
      await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess('Password changed successfully.');
    } catch (err) {
      setPasswordError(getApiErrorMessage(err, 'Unable to change your password.'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <div className="page-header">
        <h1>Profile settings</h1>
        <p>Manage your account details and update your password.</p>
      </div>

      <div className="grid two">
        <div className="card">
          <h2>Account overview</h2>
          <p>
            <strong>Username:</strong> {user?.username || '—'}
          </p>
          <p>
            <strong>Email:</strong> {user?.email || '—'}
          </p>
          <p>
            <strong>Role:</strong> {user?.role || 'user'}
          </p>
        </div>

        <form className="card form-card form-grid" onSubmit={handleProfileSubmit}>
          <h2>Edit profile</h2>
          {profileError ? <div className="alert error">{profileError}</div> : null}
          {profileSuccess ? <div className="alert success">{profileSuccess}</div> : null}

          <div className="form-row">
            <label htmlFor="profileUsername">Username</label>
            <input
              id="profileUsername"
              value={profileForm.username}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, username: event.target.value }))
              }
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="profileEmail">Email</label>
            <input
              id="profileEmail"
              type="email"
              value={profileForm.email}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, email: event.target.value }))
              }
              required
            />
          </div>

          <button type="submit" className="primary-button" disabled={isSavingProfile}>
            {isSavingProfile ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </div>

      <form className="card form-card form-grid" onSubmit={handlePasswordSubmit}>
        <h2>Change password</h2>
        {passwordError ? <div className="alert error">{passwordError}</div> : null}
        {passwordSuccess ? <div className="alert success">{passwordSuccess}</div> : null}

        <div className="form-row">
          <label htmlFor="currentPassword">Current password</label>
          <input
            id="currentPassword"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(event) =>
              setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
            }
            required
          />
        </div>

        <div className="form-row">
          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            value={passwordForm.newPassword}
            onChange={(event) =>
              setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
            }
            required
          />
        </div>

        <div className="form-row">
          <label htmlFor="confirmNewPassword">Confirm new password</label>
          <input
            id="confirmNewPassword"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(event) =>
              setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
            }
            required
          />
        </div>

        <button type="submit" className="primary-button" disabled={isSavingPassword}>
          {isSavingPassword ? 'Updating password...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
