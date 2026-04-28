import api from './api';

export const usersService = {
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data.data;
  },

  async updateProfile(data) {
    const response = await api.patch('/users/profile', data);
    return response.data.data;
  },

  async getSavedReels(params = {}) {
    const response = await api.get('/users/saved-reels', { params });
    return {
      reels: response.data.data,
      meta: response.data.meta
    };
  },

  async getFollowedRestaurants(params = {}) {
    const response = await api.get('/users/following', { params });
    return {
      restaurants: response.data.data,
      meta: response.data.meta
    };
  },

  async getAddresses() {
    const response = await api.get('/users/addresses');
    return response.data.data;
  },

  async createAddress(data) {
    const response = await api.post('/users/addresses', data);
    return response.data.data;
  },

  async updateAddress(id, data) {
    const response = await api.patch(`/users/addresses/${id}`, data);
    return response.data.data;
  },

  async deleteAddress(id) {
    const response = await api.delete(`/users/addresses/${id}`);
    return response.data.data;
  }
}; 