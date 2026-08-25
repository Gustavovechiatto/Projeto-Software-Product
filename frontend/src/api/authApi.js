import { apiClient } from './client';

export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload),
  resendConfirmation: (email) => apiClient.post('/auth/resend-confirmation', { email }),
  confirmEmail: (token) => apiClient.post('/auth/confirm-email', { token }),
  login: (payload) => apiClient.post('/auth/login', payload),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => apiClient.post('/auth/reset-password', payload),
};
