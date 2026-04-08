import express from 'express';
import request from 'supertest';
import { Scoreboard } from '../src/models/scoreboard';

const mockGetLeaderboard = jest.fn();

jest.mock('../src/middleware/auth', () => ({
  auth: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-1' };
    next();
  },
}));

jest.mock('../src/services/scoreboardService', () => ({
  ScoreboardService: jest.fn().mockImplementation(() => ({
    getLeaderboard: mockGetLeaderboard,
  })),
}));

jest.mock('../src/models/scoreboard', () => ({
  Scoreboard: {
    find: jest.fn(),
  },
}));

import { scoreboardRoutes } from '../src/routes/scoreboard.routes';

describe('scoreboard routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/scoreboard', scoreboardRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET / returns the leaderboard', async () => {
    mockGetLeaderboard.mockResolvedValue([{ username: 'leader', totalPoints: 10 }]);

    const response = await request(app).get('/api/scoreboard');

    expect(response.status).toBe(200);
    expect(response.body[0].username).toBe('leader');
  });

  test('GET /user returns the current user score history', async () => {
    (Scoreboard.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue([{ totalPoints: 15 }]),
      }),
    });

    const response = await request(app).get('/api/scoreboard/user');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ totalPoints: 15 }]);
  });
});
