import api from './api';
import type { Bracket } from '../types';

export interface CreateBracketPayload {
  name: string;
  isPublic?: boolean;
}

const bracketService = {
  async list() {
    const response = await api.get<Bracket[]>('/brackets');
    return response.data;
  },

  async create(payload: CreateBracketPayload) {
    const response = await api.post<Bracket>('/brackets', { ...payload, games: [] });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<Bracket>(`/brackets/${id}`);
    return response.data;
  },

  async update(id: string, updates: Partial<Bracket>) {
    const response = await api.put<Bracket>(`/brackets/${id}`, updates);
    return response.data;
  },

  async remove(id: string) {
    const response = await api.delete<{ message: string }>(`/brackets/${id}`);
    return response.data;
  },
};

export default bracketService;
