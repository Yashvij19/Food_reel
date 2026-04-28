import api from './api';

export const authService = {
  async register(data) {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  }
};