import api from './api';

export const restaurantsService = {
  async search(params = {}) {
    const response = await api.get('/restaurants/search', { params });
    return {
      restaurants: response.data.data,
      meta: response.data.meta
    };
  },

  async getById(id) {
    const response = await api.get(`/restaurants/${id}`);
    return response.data.data;
  },

  async getMenu(id) {
    const response = await api.get(`/restaurants/${id}/menu`);
    return response.data.data;
  },

  async toggleFollow(id) {
    const response = await api.post(`/restaurants/${id}/follow`);
    return response.data.data;
  },

  async getMyRestaurants() {
    const response = await api.get('/restaurants/my');
    return response.data.data;
  },

  async createRestaurant(data) {
    const response = await api.post('/restaurants', data);
    return response.data.data;
  },

  async updateRestaurant(id, data) {
    const response = await api.patch(`/restaurants/${id}`, data);
    return response.data.data;
  },

  async addMenuItem(restaurantId, data) {
    const response = await api.post(`/restaurants/${restaurantId}/menu`, data);
    return response.data.data;
  },

  async updateMenuItem(restaurantId, itemId, data) {
    const response = await api.patch(`/restaurants/${restaurantId}/menu/${itemId}`, data);
    return response.data.data;
  },

  async deleteMenuItem(restaurantId, itemId) {
    const response = await api.delete(`/restaurants/${restaurantId}/menu/${itemId}`);
    return response.data.data;
  }
};