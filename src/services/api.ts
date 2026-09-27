import { authService } from './api/auth.service';
import { orderService } from './api/order.service';
import { clientService } from './api/client.service';
import { paymentService } from './api/payment.service';
import { dashboardService } from './api/dashboard.service';
import { workshopService } from './api/workshop.service';
import { storageService } from './api/storage.service';
import { subscriptionService } from './api/subscription.service';

export * from './api/index';

export const api = {
  // Auth
  register: authService.register,
  login: authService.login,

  // Orders
  listOrders: orderService.listOrders,
  getOrderById: orderService.getOrderById,
  createOrder: orderService.createOrder,
  updateOrderStatus: orderService.updateOrderStatus,

  // Clients
  listClients: clientService.listClients,
  getClientById: clientService.getClientById,
  createClient: clientService.createClient,
  updateClient: clientService.updateClient,

  // Payments
  listPayments: paymentService.listPayments,
  recordPayment: paymentService.recordPayment,

  // Dashboard
  getDashboard: dashboardService.getDashboard,

  // Workshops
  listMembers: workshopService.listMembers,
  inviteEmployee: workshopService.inviteEmployee,
  revokeEmployee: workshopService.revokeEmployee,

  // Storage
  uploadImage: storageService.uploadImage,

  // Subscriptions
  getPublicConfig: subscriptionService.getPublicConfig,
  getCurrentSubscription: subscriptionService.getCurrentSubscription,
  createManualPayment: subscriptionService.createManualPayment,
};
