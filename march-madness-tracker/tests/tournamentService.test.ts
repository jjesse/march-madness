import { TournamentService } from '../src/services/tournamentService';

describe('TournamentService', () => {
  const cache = {
    get: jest.fn(),
    setex: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn();
  });

  test('returns cached tournament data when available', async () => {
    const cachedTournament = { year: 2026, name: 'Cached Tournament' };
    cache.get.mockResolvedValue(JSON.stringify(cachedTournament));

    const service = new TournamentService('https://example.com/tournament', cache);
    const data = await service.fetchTournamentData();

    expect(data).toEqual(cachedTournament);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('fetches and caches tournament data on a cache miss', async () => {
    const tournamentData = { year: 2026, name: 'Live Tournament' };
    cache.get.mockResolvedValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(tournamentData),
    });

    const service = new TournamentService('https://example.com/tournament', cache);
    const data = await service.fetchTournamentData();

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/tournament');
    expect(cache.setex).toHaveBeenCalledWith('tournament', 300, JSON.stringify(tournamentData));
    expect(data).toEqual(tournamentData);
  });

  test('updates tournament data with a PATCH request', async () => {
    const updatedData = { status: 'in-progress' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(updatedData),
    });

    const service = new TournamentService('https://example.com/tournament', cache);
    await service.updateTournamentData(updatedData as any);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/tournament',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(cache.setex).toHaveBeenCalledWith('tournament', 300, JSON.stringify(updatedData));
  });
});
