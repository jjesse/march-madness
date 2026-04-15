import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LeaderboardTable from './LeaderboardTable';

describe('LeaderboardTable', () => {
  it('renders scoreboard entries and highlights the current user', () => {
    render(
      <LeaderboardTable
        currentUser={{ id: 'user-1', username: 'leader', email: 'leader@example.com' }}
        entries={[
          {
            userId: 'user-1',
            username: 'leader',
            totalCorrect: 12,
            totalPoints: 42,
            year: 2026,
            rank: 1,
          },
          {
            userId: 'user-2',
            username: 'runnerup',
            totalCorrect: 10,
            totalPoints: 30,
            year: 2026,
            rank: 2,
          },
        ]}
      />
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('leader (you)')).toBeInTheDocument();
    expect(screen.getByText('runnerup')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
