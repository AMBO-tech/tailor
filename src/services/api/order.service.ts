import { request } from './apiClient';
import { Order, CreateOrderDto, OrderStatus } from '@types';

export const orderService = {
  async listOrders(status?: string): Promise<Order[]> {
    const url = status && status !== 'ALL' ? `/orders?status=${status}` : '/orders';
    return request<Order[]>(url);
  },

  async getOrderById(id: string): Promise<Order> {
    return request<Order>(`/orders/${id}`);
  },

  async createOrder(data: CreateOrderDto): Promise<Order> {
    return request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOrderStatus(id: string, status: OrderStatus | string): Promise<Order> {
    return request<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
