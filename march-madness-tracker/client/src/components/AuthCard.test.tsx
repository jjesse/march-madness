import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AuthCard from './AuthCard';

describe('AuthCard', () => {
  it('renders the auth form, message, and footer link', () => {
    render(
      <MemoryRouter>
        <AuthCard
          title="Sign in"
          description="Access your brackets."
          error="Invalid credentials"
          footerText="Need an account?"
          footerLinkLabel="Create one"
          footerLinkTo="/register"
          onSubmit={vi.fn()}
        >
          <button type="submit">Continue</button>
        </AuthCard>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create one' })).toHaveAttribute('href', '/register');
  });
});
