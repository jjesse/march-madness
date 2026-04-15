import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import BracketMatchupCard from './BracketMatchupCard';

describe('BracketMatchupCard', () => {
  it('lets the user choose and clear a pick for an unlocked game', async () => {
    const user = userEvent.setup();
    const onPickSelect = vi.fn();
    const onClearPick = vi.fn();

    render(
      <table>
        <tbody>
          <BracketMatchupCard
            game={{
              key: 'game-1',
              id: 'game-1',
              teamA: 'Team A',
              teamB: 'Team B',
              scoreA: 0,
              scoreB: 0,
              status: 'not started',
              round: 1,
              region: 'East',
              userPick: 'Team A',
              pickStatus: 'pending',
              isLocked: false,
            }}
            onPickSelect={onPickSelect}
            onClearPick={onClearPick}
          />
        </tbody>
      </table>
    );

    await user.click(screen.getByRole('button', { name: 'Team B' }));
    await user.click(screen.getByRole('button', { name: 'Clear pick' }));

    expect(onPickSelect).toHaveBeenCalledWith('Team B');
    expect(onClearPick).toHaveBeenCalled();
    expect(screen.getByText('Selected: Team A')).toBeInTheDocument();
  });

  it('disables pick controls for locked games', () => {
    render(
      <table>
        <tbody>
          <BracketMatchupCard
            game={{
              key: 'game-2',
              id: 'game-2',
              teamA: 'Team C',
              teamB: 'Team D',
              scoreA: 77,
              scoreB: 70,
              status: 'completed',
              round: 2,
              region: 'West',
              winnerName: 'Team C',
              pickStatus: 'correct',
              isLocked: true,
            }}
            onPickSelect={vi.fn()}
            onClearPick={vi.fn()}
          />
        </tbody>
      </table>
    );

    expect(screen.getByRole('button', { name: 'Team C' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Team D' })).toBeDisabled();
    expect(screen.getByText('completed (locked)')).toBeInTheDocument();
  });
});
