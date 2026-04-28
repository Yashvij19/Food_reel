import api from './api';

export const analyticsService = {
  async getRestaurantAnalytics(restaurantId, period = '30d') {
    const response = await api.get(`/analytics/restaurant/${restaurantId}`, {
      params: { period }
    });
    return response.data.data;
  },

  async getReelAnalytics(reelId) {
    const response = await api.get(`/analytics/reels/${reelId}`);
    return response.data.data;
  }
};