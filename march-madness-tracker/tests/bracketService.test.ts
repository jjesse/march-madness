import { BracketService } from '../src/services/bracketService';
import { Bracket } from '../src/models/bracket';

jest.mock('../src/models/bracket', () => ({
  Bracket: jest.fn(),
}));

describe('BracketService', () => {
  const BracketMock = Bracket as unknown as jest.Mock & {
    find: jest.Mock;
    findOneAndUpdate: jest.Mock;
    deleteOne: jest.Mock;
  };

  const tournament = {
    populate: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    BracketMock.find = jest.fn();
    BracketMock.findOneAndUpdate = jest.fn();
    BracketMock.deleteOne = jest.fn();
  });

  test('loads games from the populated tournament relationship', async () => {
    const populatedGames = [{ id: 'game-1' }, { id: 'game-2' }];
    tournament.populate.mockResolvedValue({ games: populatedGames });

    const service = new BracketService(tournament);
    await service.loadGames();

    expect(tournament.populate).toHaveBeenCalledWith('games');
    expect(service.getBracket()).toEqual(populatedGames);
  });

  test('creates a bracket for the specified user', async () => {
    const savedBracket = { id: 'bracket-1' };
    const save = jest.fn().mockResolvedValue(savedBracket);
    BracketMock.mockImplementation((data) => ({ ...data, save }));

    const service = new BracketService(tournament);
    const result = await service.createBracket('user-1', { name: 'My Picks' } as any);

    expect(BracketMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Picks',
        userId: 'user-1',
        year: new Date().getFullYear(),
      })
    );
    expect(result).toBe(savedBracket);
  });

  test('reports successful deletions', async () => {
    BracketMock.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const service = new BracketService(tournament);

    await expect(service.deleteBracket('bracket-1', 'user-1')).resolves.toBe(true);
  });
});
