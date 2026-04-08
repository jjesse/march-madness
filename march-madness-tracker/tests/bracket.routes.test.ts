import express from 'express';
import request from 'supertest';
import { Bracket } from '../src/models/bracket';

jest.mock('../src/middleware/auth', () => ({
  auth: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-1' };
    next();
  },
}));

jest.mock('../src/models/bracket', () => ({
  Bracket: jest.fn(),
}));

import { bracketRoutes } from '../src/routes/bracket.routes';

describe('bracket routes', () => {
  const BracketMock = Bracket as unknown as jest.Mock & {
    find: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    deleteOne: jest.Mock;
  };

  const app = express();
  app.use(express.json());
  app.use('/api/brackets', bracketRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
    BracketMock.find = jest.fn();
    BracketMock.findOne = jest.fn();
    BracketMock.findOneAndUpdate = jest.fn();
    BracketMock.deleteOne = jest.fn();
    BracketMock.mockImplementation((data) => ({
      ...data,
      id: 'bracket-1',
      save: jest.fn().mockResolvedValue({ id: 'bracket-1', ...data }),
    }));
  });

  test('GET / returns all brackets for the authenticated user', async () => {
    BracketMock.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue([{ id: 'bracket-1' }]),
    });

    const response = await request(app).get('/api/brackets');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 'bracket-1' }]);
  });

  test('POST / validates required fields', async () => {
    const response = await request(app).post('/api/brackets').send({});

    expect(response.status).toBe(400);
  });

  test('POST / creates a new bracket', async () => {
    const response = await request(app).post('/api/brackets').send({
      name: 'My bracket',
      isPublic: true,
    });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('My bracket');
  });

  test('GET /:id returns 404 when the bracket does not exist', async () => {
    BracketMock.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const response = await request(app).get('/api/brackets/bracket-1');

    expect(response.status).toBe(404);
  });

  test('PUT /:id updates an existing bracket', async () => {
    BracketMock.findOneAndUpdate.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ id: 'bracket-1', name: 'Updated bracket' }),
    });

    const response = await request(app).put('/api/brackets/bracket-1').send({
      name: 'Updated bracket',
    });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated bracket');
  });

  test('DELETE /:id removes an existing bracket', async () => {
    BracketMock.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const response = await request(app).delete('/api/brackets/bracket-1');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Bracket deleted');
  });
});
