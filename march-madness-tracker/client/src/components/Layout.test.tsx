import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Layout from './Layout';

const mockLogout = vi.fn();
const mockUseAuth = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Layout', () => {
  beforeEach(() => {
    mockLogout.mockReset();
    mockNavigate.mockReset();
  });

  it('renders accessible public navigation links', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null, logout: mockLogout });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<div>Home content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /march madness tracker/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leaderboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
  });

  it('renders authenticated navigation and logs out safely', async () => {
    const user = userEvent.setup();
    mockLogout.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'bracketfan' },
      logout: mockLogout,
    });

    render(
      <MemoryRouter initialEntries={['/brackets']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/brackets" element={<div>Brackets</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Results' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
