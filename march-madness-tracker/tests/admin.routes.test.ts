import express from 'express';
import request from 'supertest';
import { Game } from '../src/models/game';
import { Tournament } from '../src/models/tournament';

const mockSyncBracket = jest.fn();

jest.mock('../src/middleware/auth', () => ({
  auth: (req: any, _res: any, next: any) => {
    req.user = { id: 'admin-user', email: 'admin@example.com', role: 'admin' };
    next();
  },
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../src/services/bracketIngestionService', () => ({
  BracketIngestionService: jest.fn().mockImplementation(() => ({
    syncBracket: mockSyncBracket,
  })),
}));

jest.mock('../src/models/game', () => ({
  Game: {
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../src/models/tournament', () => ({
  Tournament: jest.fn(),
}));

import adminRoutes from '../src/routes/admin.routes';

describe('admin routes', () => {
  const TournamentMock = Tournament as unknown as jest.Mock & {
    findOne: jest.Mock;
  };

  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
    TournamentMock.findOne = jest.fn();
    TournamentMock.mockImplementation((data) => ({
      ...data,
      _id: 'tournament-1',
      games: [],
      save: jest.fn().mockResolvedValue(undefined),
    }));
  });

  test('POST /sync/bracket triggers a bracket sync', async () => {
    mockSyncBracket.mockResolvedValue(undefined);

    const response = await request(app).post('/api/admin/sync/bracket');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('GET /sync/status returns sync metadata', async () => {
    const response = await request(app).get('/api/admin/sync/status');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('POST /manual/games seeds a manual game', async () => {
    TournamentMock.findOne.mockResolvedValue(null);
    (Game.findOneAndUpdate as jest.Mock).mockResolvedValue({ _id: 'game-1', id: 'manual-1' });

    const response = await request(app).post('/api/admin/manual/games').send({
      teamA: 'Team A',
      teamB: 'Team B',
      scoreA: 70,
      scoreB: 65,
      round: 1,
      region: 'East',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test('PATCH /manual/games/:id updates a manual game', async () => {
    (Game.findOneAndUpdate as jest.Mock).mockResolvedValue({ id: 'manual-1', scoreA: 80 });

    const response = await request(app).patch('/api/admin/manual/games/manual-1').send({
      scoreA: 80,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
