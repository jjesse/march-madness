import { MasterBracketService } from '../src/services/masterBracketService';
import { Bracket } from '../src/models/bracket';
import { Game } from '../src/models/game';

jest.mock('../src/models/bracket', () => ({
  Bracket: {
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../src/models/game', () => ({
  Game: {
    findOneAndUpdate: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

describe('MasterBracketService', () => {
  const redis = {
    get: jest.fn(),
    setex: jest.fn(),
  } as any;

  const dataSource = {
    type: 'mock',
    fetchCurrentBracket: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses the configured adapter to persist and cache bracket data', async () => {
    const populatedBracket = {
      id: 'master-bracket',
      games: [{ id: 'game-1', status: 'completed', winnerId: 'team-a' }],
    };

    const savedBracket = {
      _id: 'bracket-1',
      games: [],
      save: jest.fn().mockResolvedValue(undefined),
      populate: jest.fn().mockResolvedValue(populatedBracket),
    };

    (Bracket.findOneAndUpdate as jest.Mock).mockResolvedValue(savedBracket);
    (Game.findOneAndUpdate as jest.Mock).mockResolvedValue({ _id: 'game-doc-1' });
    (Game.deleteMany as jest.Mock).mockResolvedValue(undefined);

    dataSource.fetchCurrentBracket.mockResolvedValue({
      games: [
        {
          id: 'game-1',
          team1: { id: 'team-a', name: 'Team A', score: 70 },
          team2: { id: 'team-b', name: 'Team B', score: 65 },
          status: 'completed',
          round: 1,
          region: 'East',
          winnerId: 'team-a',
          winner: { id: 'team-a', name: 'Team A' },
          startTime: '2026-03-20T00:00:00.000Z',
        },
      ],
    });

    const service = new MasterBracketService(redis, 30, dataSource, false);
    const result = await service.updateMasterBracket();

    expect(dataSource.fetchCurrentBracket).toHaveBeenCalled();
    expect(Game.findOneAndUpdate).toHaveBeenCalledWith(
      { id: 'game-1', bracketId: 'bracket-1' },
      expect.objectContaining({
        teamA: 'Team A',
        teamB: 'Team B',
        winnerId: 'team-a',
      }),
      expect.objectContaining({ upsert: true })
    );
    expect(redis.setex).toHaveBeenCalled();
    expect(result).toEqual(populatedBracket);
  });

  test('returns a cached bracket when available', async () => {
    const cachedBracket = { games: [{ id: 'game-1' }] };
    redis.get.mockResolvedValue(JSON.stringify(cachedBracket));

    const service = new MasterBracketService(redis, 30, dataSource, false);

    await expect(service.getMasterBracket()).resolves.toEqual(cachedBracket);
    expect(dataSource.fetchCurrentBracket).not.toHaveBeenCalled();
  });

  test('validates a completed user pick correctly', async () => {
    redis.get.mockResolvedValue(
      JSON.stringify({
        games: [{ id: 'game-1', status: 'completed', winnerId: 'team-a' }],
      })
    );

    const service = new MasterBracketService(redis, 30, dataSource, false);

    await expect(service.validateUserPick('game-1', 'team-a')).resolves.toBe('correct');
    await expect(service.validateUserPick('game-1', 'team-b')).resolves.toBe('incorrect');
    await expect(service.validateUserPick('missing-game', 'team-a')).resolves.toBe('pending');
  });
});
