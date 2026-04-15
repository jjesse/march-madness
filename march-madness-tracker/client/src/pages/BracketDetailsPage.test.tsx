import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BracketDetailsPage from './BracketDetailsPage';

const mockGetById = vi.fn();
const mockUpdate = vi.fn();

vi.mock('../services/bracketService', () => ({
  default: {
    getById: (...args: unknown[]) => mockGetById(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'bracket-1' }),
  };
});

describe('BracketDetailsPage', () => {
  beforeEach(() => {
    mockGetById.mockReset();
    mockUpdate.mockReset();
  });

  it('loads a bracket, lets the user choose a winner, and saves the picks', async () => {
    const user = userEvent.setup();
    const bracket = {
      key: 'bracket-1',
      _id: 'bracket-1',
      id: 'bracket-1',
      name: 'My Championship Picks',
      year: 2024,
      isPublic: false,
      totalPoints: 8,
      games: [
        {
          key: 'game-1',
          _id: 'game-1',
          id: 'game-1',
          teamA: 'Lions',
          teamB: 'Bulls',
          scoreA: 0,
          scoreB: 0,
          status: 'not started' as const,
          round: 1,
          region: 'East',
          pickStatus: 'pending' as const,
          isLocked: false,
        },
      ],
    };

    mockGetById.mockResolvedValue(bracket);
    mockUpdate.mockResolvedValue({
      ...bracket,
      games: [
        {
          ...bracket.games[0],
          userPick: 'Lions',
        },
      ],
    });

    render(
      <MemoryRouter>
        <BracketDetailsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'My Championship Picks' })).toBeInTheDocument();
    expect(screen.getByLabelText('Bracket name')).toHaveValue('My Championship Picks');

    await user.click(screen.getByRole('button', { name: 'Lions' }));
    expect(screen.getByText('Selected: Lions')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save picks' }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('bracket-1', {
        name: 'My Championship Picks',
        isPublic: false,
        games: [
          {
            _id: 'game-1',
            id: 'game-1',
            userPick: 'Lions',
          },
        ],
      });
    });

    expect(await screen.findByText('Bracket and picks saved successfully.')).toBeInTheDocument();
  });
});
