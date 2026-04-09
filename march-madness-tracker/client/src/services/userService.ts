import api from './api';
import type { User } from '../types';

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

const userService = {
  async getProfile() {
    const response = await api.get<User>('/users/profile');
    return response.data;
  },

  async updateProfile(payload: Partial<Pick<User, 'email' | 'username'>>) {
    const response = await api.put<User>('/users/profile', payload);
    return response.data;
  },

  async changePassword(payload: ChangePasswordPayload) {
    const response = await api.post<{ message: string }>('/users/change-password', payload);
    return response.data;
  },
};

export default userService;
