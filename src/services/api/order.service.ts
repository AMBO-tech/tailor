import { request } from './apiClient';
import { Order, CreateOrderDto, OrderStatus, CursorPage } from '@types';
import { buildPageUrl, toCursorPage } from './pagination';

export const orderService = {
  async listOrders(status?: string): Promise<Order[]> {
    const url = status && status !== 'ALL' ? `/orders?status=${status}` : '/orders';
    return request<Order[]>(url);
  },

  /** Page de commandes (`?limit=30&cursor=`), filtrable par statut. */
  async listOrdersPage(status?: string, cursor?: string): Promise<CursorPage<Order>> {
    const filter = status && status !== 'ALL' ? status : undefined;
    return toCursorPage(await request<Order[] | CursorPage<Order>>(buildPageUrl('/orders', { status: filter }, cursor)));
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
