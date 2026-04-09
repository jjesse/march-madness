import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { useAuth } from '../hooks/useAuth';
import type { ApiError } from '../types';

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await register({
        email: form.email,
        username: form.username,
        password: form.password,
      });
      navigate('/brackets');
    } catch (err) {
      const apiError = err as { response?: { data?: ApiError } };
      setError(apiError.response?.data?.error || 'Unable to create your account.');
    }
  };

  return (
    <AuthCard
      title="Create your account"
      description="Start building brackets and tracking March Madness picks."
      error={error}
      footerText="Already registered?"
      footerLinkLabel="Sign in here"
      footerLinkTo="/login"
      onSubmit={handleSubmit}
    >
      <div className="form-row">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={form.username}
          onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={(event) =>
            setForm((current) => ({ ...current, confirmPassword: event.target.value }))
          }
          required
        />
      </div>

      <button type="submit" className="primary-button" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create account'}
      </button>
    </AuthCard>
  );
}
