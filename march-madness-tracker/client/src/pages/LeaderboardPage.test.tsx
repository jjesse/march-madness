import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LeaderboardPage from './LeaderboardPage';

const mockGetLeaderboard = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../services/scoreboardService', () => ({
  default: {
    getLeaderboard: (...args: unknown[]) => mockGetLeaderboard(...args),
  },
}));

describe('LeaderboardPage', () => {
  beforeEach(() => {
    mockGetLeaderboard.mockReset();
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'fan@example.com', username: 'bracketfan' },
    });
  });

  it('loads and renders leaderboard standings for the current season', async () => {
    mockGetLeaderboard.mockResolvedValue([
      {
        userId: 'user-1',
        username: 'bracketfan',
        totalCorrect: 12,
        totalPoints: 48,
        year: 2024,
        rank: 1,
      },
      {
        userId: 'user-2',
        username: 'challenger',
        totalCorrect: 10,
        totalPoints: 40,
        year: 2024,
        rank: 2,
      },
    ]);

    render(
      <MemoryRouter>
        <LeaderboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Leaderboard' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tournament year')).toHaveValue(String(new Date().getFullYear()));
    expect(screen.getByText('bracketfan')).toBeInTheDocument();
    expect(screen.getByText('challenger')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetLeaderboard).toHaveBeenCalledWith(new Date().getFullYear());
    });
  });

  it('reloads standings for the requested year', async () => {
    const user = userEvent.setup();
    mockGetLeaderboard.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <LeaderboardPage />
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: 'Leaderboard' });

    const yearInput = screen.getByLabelText('Tournament year');
    await user.clear(yearInput);
    await user.type(yearInput, '2024');
    await user.click(screen.getByRole('button', { name: 'Load standings' }));

    await waitFor(() => {
      expect(mockGetLeaderboard).toHaveBeenLastCalledWith(2024);
    });

    expect(screen.getByText('No standings available')).toBeInTheDocument();
  });
});
