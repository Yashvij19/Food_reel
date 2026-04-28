import api from './api';

export const reelsService = {
  async getFeed(params = {}) {
    const response = await api.get('/reels/feed', { params });
    return {
      reels: response.data.data,
      meta: response.data.meta
    };
  },

  async getReelById(id) {
    const response = await api.get(`/reels/${id}`);
    return response.data.data;
  },

  async createReel(data) {
    const response = await api.post('/reels', data);
    return response.data.data;
  },

  async deleteReel(id) {
    const response = await api.delete(`/reels/${id}`);
    return response.data.data;
  },

  async recordView(id, watchMs) {
    const response = await api.post(`/reels/${id}/view`, { watchMs });
    return response.data.data;
  },

  async toggleLike(id) {
    const response = await api.post(`/reels/${id}/like`);
    return response.data.data;
  },

  async toggleSave(id) {
    const response = await api.post(`/reels/${id}/save`);
    return response.data.data;
  },

  async getComments(id, params = {}) {
    const response = await api.get(`/reels/${id}/comments`, { params });
    return {
      comments: response.data.data,
      meta: response.data.meta
    };
  },

  async createComment(id, text) {
    const response = await api.post(`/reels/${id}/comments`, { text });
    return response.data.data;
  },

  async deleteComment(reelId, commentId) {
    const response = await api.delete(`/reels/${reelId}/comments/${commentId}`);
    return response.data.data;
  }
};