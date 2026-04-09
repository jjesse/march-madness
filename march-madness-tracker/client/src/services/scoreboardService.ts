import api from './api';
import type { ScoreboardEntry } from '../types';

const scoreboardService = {
  async getLeaderboard(year?: number) {
    const response = await api.get<ScoreboardEntry[]>('/scoreboard', {
      params: year ? { year } : undefined,
    });
    return response.data;
  },

  async getUserScores() {
    const response = await api.get<ScoreboardEntry[]>('/scoreboard/user');
    return response.data;
  },
};

export default scoreboardService;
