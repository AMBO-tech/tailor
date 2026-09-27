import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { PublicRoute } from './PublicRoute';
import { AppLayout } from '@components/layout/AppLayout';
import {
  DashboardPage,
  OrdersPage,
  ClientsPage,
  PaymentsPage,
  SettingsPage,
  LoginPage,
  NotFoundPage,
  AdminLoginPage,
  AdminPage,
  JoinPage,
} from '@pages';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Invitation d'un employé (lien WhatsApp `/join?token=…`, ouverte même connecté) */}
      <Route path="/join" element={<JoinPage />} />
      <Route path="/join/:token" element={<JoinPage />} />

      {/* Back-office (session d'administration séparée, voir utils/adminSession) */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminPage />} />

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
