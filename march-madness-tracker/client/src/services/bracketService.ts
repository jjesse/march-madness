import type { Bracket, NormalizedBracket } from '../types';
import { normalizeBracket } from '../utils/normalize';
import api from './api';

export interface CreateBracketPayload {
  name: string;
  isPublic?: boolean;
}

const bracketService = {
  async list(): Promise<NormalizedBracket[]> {
    const response = await api.get<Bracket[]>('/brackets');
    return response.data.map(normalizeBracket);
  },

  async create(payload: CreateBracketPayload): Promise<NormalizedBracket> {
    const response = await api.post<Bracket>('/brackets', { ...payload, games: [] });
    return normalizeBracket(response.data);
  },

  async getById(id: string): Promise<NormalizedBracket> {
    const response = await api.get<Bracket>(`/brackets/${id}`);
    return normalizeBracket(response.data);
  },

  async update(id: string, updates: Partial<Bracket>): Promise<NormalizedBracket> {
    const response = await api.put<Bracket>(`/brackets/${id}`, updates);
    return normalizeBracket(response.data);
  },

  async remove(id: string) {
    const response = await api.delete<{ message: string }>(`/brackets/${id}`);
    return response.data;
  },
};

export default bracketService;
