import { request } from './apiClient';
import { AuthResponse, LoginDto, RegisterDto } from '@types';

export const authService = {
  async register(data: RegisterDto): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: LoginDto): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
