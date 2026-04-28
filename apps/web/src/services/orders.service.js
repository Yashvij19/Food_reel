import api from './api';

export const ordersService = {
  async createOrder(data) {
    const response = await api.post('/orders', data);
    return response.data.data;
  },

  async getOrderHistory(params = {}) {
    const response = await api.get('/orders/history', { params });
    return {
      orders: response.data.data,
      meta: response.data.meta
    };
  },

  async getOrderById(id) {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  },

  async updateAddress(id, deliveryAddress) {
    const response = await api.patch(`/orders/${id}/address`, { deliveryAddress });
    return response.data.data;
  },

  async updateStatus(id, status) {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data.data;
  },

  async confirmPayment(id) {
    const response = await api.post(`/orders/${id}/payment-confirm`);
    return response.data.data;
  },

  async getRestaurantOrders(restaurantId, params = {}) {
    const response = await api.get(`/orders/restaurant/${restaurantId}`, { params });
    return {
      orders: response.data.data,
      meta: response.data.meta
    };
  }
};