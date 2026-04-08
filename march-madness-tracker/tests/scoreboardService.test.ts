import { ScoreboardService } from '../src/services/scoreboardService';
import { Bracket } from '../src/models/bracket';
import { Scoreboard } from '../src/models/scoreboard';

jest.mock('../src/models/bracket', () => ({
  Bracket: {
    findById: jest.fn(),
  },
}));

jest.mock('../src/models/scoreboard', () => ({
  Scoreboard: {
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
  },
}));

describe('ScoreboardService', () => {
  const metricsService = {
    incrementScoreUpdate: jest.fn(),
  } as any;

  const masterBracketService = {
    getMasterBracket: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calculates correct picks using the userPick field', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    (Bracket.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        games: [
          { id: 'game-1', round: 1, userPick: 'team-a', save, pickStatus: 'pending' },
          { id: 'game-2', round: 2, userPick: 'team-x', save, pickStatus: 'pending' },
        ],
      }),
    });

    masterBracketService.getMasterBracket.mockResolvedValue({
      games: [
        { id: 'game-1', round: 1, status: 'completed', winnerId: 'team-a', winnerName: 'Team A' },
        { id: 'game-2', round: 2, status: 'completed', winnerId: 'team-b', winnerName: 'Team B' },
      ],
    });

    (Scoreboard.findOneAndUpdate as jest.Mock).mockResolvedValue({
      totalCorrect: 1,
      totalPoints: 1,
    });

    const service = new ScoreboardService(metricsService, masterBracketService);
    await service.updateUserScore('bracket-1', 'user-1');

    expect(Scoreboard.findOneAndUpdate).toHaveBeenCalledWith(
      { bracketId: 'bracket-1', userId: 'user-1' },
      expect.objectContaining({
        totalCorrect: 1,
        totalPoints: 1,
      }),
      { new: true, upsert: true }
    );
    expect(metricsService.incrementScoreUpdate).toHaveBeenCalled();
  });

  test('returns pick status details for a bracket', async () => {
    (Bracket.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        games: [
          { id: 'game-1', userPick: 'team-a', pickStatus: 'correct' },
          { id: 'game-2', userPick: undefined, pickStatus: undefined },
        ],
      }),
    });

    masterBracketService.getMasterBracket.mockResolvedValue({
      games: [{ id: 'game-1', winnerName: 'Team A' }],
    });

    const service = new ScoreboardService(metricsService, masterBracketService);
    const statuses = await service.getPickStatus('bracket-1');

    expect(statuses).toEqual([
      {
        gameId: 'game-1',
        status: 'correct',
        pick: 'team-a (correct)',
        actual: 'Team A',
      },
      {
        gameId: 'game-2',
        status: 'pending',
        pick: 'No pick',
        actual: 'Not completed',
      },
    ]);
  });
});
