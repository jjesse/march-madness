import api from './api';
import type { AuthResponse, User } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  username: string;
}

const authService = {
  async register(payload: RegisterPayload) {
    const response = await api.post<{ message: string; userId: string }>('/users/register', payload);
    return response.data;
  },

  async login(payload: LoginPayload) {
    const response = await api.post<AuthResponse>('/users/login', payload);
    return response.data;
  },

  async logout() {
    const response = await api.post<{ message: string }>('/users/logout');
    return response.data;
  },

  async getProfile() {
    const response = await api.get<User>('/users/profile');
    return response.data;
  },
};

export default authService;
