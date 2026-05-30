import axios from 'axios'
import { isClerkEnabled } from '../config/auth'

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:8000/api')

let clerkTokenGetter = null

export function setClerkTokenGetter(getter) {
  clerkTokenGetter = getter
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

async function resolveAuthToken(options = {}) {
  if (isClerkEnabled && clerkTokenGetter) {
    try {
      const clerkToken = await clerkTokenGetter(options)
      if (clerkToken) return clerkToken
    } catch (_) {
      // No Clerk session
    }
  }

  const legacyToken = localStorage.getItem('access_token')
  if (legacyToken) {
    return legacyToken
  }

  return null
}

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await resolveAuthToken(
      config._clerkSkipCache ? { skipCache: true } : {},
    )
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const detail = error.response?.data?.detail
    const subscriptionBlocked =
      typeof detail === 'string' &&
      detail.toLowerCase().includes('trial or subscription')

    if (error.response?.status === 401 && subscriptionBlocked) {
      if (!window.location.pathname.startsWith('/app/billing')) {
        window.location.href = '/app/billing'
      }
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (isClerkEnabled && clerkTokenGetter) {
        try {
          const token = await clerkTokenGetter({ skipCache: true })
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          }
        } catch (_) {
          // Fall through to legacy refresh or redirect
        }
      }

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) throw new Error('No refresh token')

        const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        })

        const { access } = response.data
        localStorage.setItem('access_token', access)

        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (!isClerkEnabled) {
          const isAdminPath = window.location.pathname.startsWith('/admin')
          window.location.href = isAdminPath ? '/admin/login' : '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  refreshToken: (refresh) => axios.post(`${API_URL}/auth/token/refresh/`, { refresh }),
  getProfile: (config) => api.get('/auth/me/', config),
  getReceiptSettings: () => api.get('/auth/receipt-settings/'),
  updateReceiptSettings: (data) => api.put('/auth/receipt-settings/', data),
  updateProfile: (data) => api.put('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
}

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products/', { params }),
  getOne: (id) => api.get(`/products/${id}/`),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.put(`/products/${id}/`, data),
  delete: (id) => api.delete(`/products/${id}/`),
  restock: (id, data) => api.post(`/products/${id}/restock/`, data),
  getLowStock: () => api.get('/products/low_stock/'),
  getCategories: () => api.get('/products/categories/'),
  getSummary: () => api.get('/products/inventory_summary/'),
}

// Sales API
export const salesAPI = {
  getAll: (params) => api.get('/sales/', { params }),
  getOne: (id) => api.get(`/sales/${id}/`),
  create: (data) => api.post('/sales/', data),
  getSummary: (params) => api.get('/sales/summary/', { params }),
  getDailySales: () => api.get('/sales/daily_sales/'),
  getTopProducts: (limit = 10) => api.get('/sales/top_products/', { params: { limit } }),
  getRecent: (limit = 10) => api.get('/sales/recent/', { params: { limit } }),
  getReceipt: (id) => api.get(`/sales/${id}/receipt/`, { responseType: 'blob' }),
}

// Customers API
export const customersAPI = {
  getAll: (params) => api.get('/customers/', { params }),
  getOne: (id) => api.get(`/customers/${id}/`),
  create: (data) => api.post('/customers/', data),
  update: (id, data) => api.put(`/customers/${id}/`, data),
  delete: (id) => api.delete(`/customers/${id}/`),
  getPurchaseHistory: (id) => api.get(`/customers/${id}/purchase_history/`),
  getCreditHistory: (id) => api.get(`/customers/${id}/credit_history/`),
  getWithDebt: () => api.get('/customers/with_debt/'),
}

// Credits API
export const creditsAPI = {
  getAll: (params) => api.get('/credits/', { params }),
  getOne: (id) => api.get(`/credits/${id}/`),
  create: (data) => api.post('/credits/', data),
  update: (id, data) => api.put(`/credits/${id}/`, data),
  recordPayment: (id, data) => api.post(`/credits/${id}/record_payment/`, data),
  getOverdue: () => api.get('/credits/overdue/'),
  getPending: () => api.get('/credits/pending/'),
  getSummary: () => api.get('/credits/summary/'),
  getPaymentHistory: (id) => api.get(`/credits/${id}/payment_history/`),
}

// Expenses API
export const expensesAPI = {
  getAll: (params) => api.get('/expenses/', { params }),
  getOne: (id) => api.get(`/expenses/${id}/`),
  create: (data) => api.post('/expenses/', data),
  update: (id, data) => api.put(`/expenses/${id}/`, data),
  delete: (id) => api.delete(`/expenses/${id}/`),
  getSummary: (params) => api.get('/expenses/summary/', { params }),
  getByCategory: () => api.get('/expenses/by_category/'),
  getMonthlyTrend: () => api.get('/expenses/monthly_trend/'),
  getCategories: () => api.get('/expenses/categories/'),
}

// Reinvestments API
export const reinvestmentsAPI = {
  getAll: (params) => api.get('/reinvestments/', { params }),
  getOne: (id) => api.get(`/reinvestments/${id}/`),
  create: (data) => api.post('/reinvestments/', data),
  update: (id, data) => api.put(`/reinvestments/${id}/`, data),
  delete: (id) => api.delete(`/reinvestments/${id}/`),
  getSummary: (params) => api.get('/reinvestments/summary/', { params }),
  getByPurpose: () => api.get('/reinvestments/by_purpose/'),
  getPurposes: () => api.get('/reinvestments/purposes/'),
}

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard/'),
  getCapital: () => api.get('/analytics/capital/'),
  getCashflow: (params) => api.get('/analytics/cashflow/', { params }),
  getReports: (params) => api.get('/analytics/reports/', { params }),
  getProjections: (params) => api.get('/analytics/projections/', { params }),
  getMonthly: (params) => api.get('/analytics/monthly/', { params }),
  getComprehensiveReport: (params) => api.get('/analytics/comprehensive-report/', { params }),
}

// Billing + subscription APIs
export const billingAPI = {
  getMyStatus: () => api.get('/billing/me/'),
  submitPaymentProof: (formData) => api.post('/billing/submit-proof/', formData),
  getHistory: () => api.get('/billing/history/'),
  getAdminOverview: () => api.get('/billing/admin/overview/'),
  getAdminUsers: (params) => api.get('/billing/admin/users/', { params }),
  exportAdminUsersCsv: (params) => api.get('/billing/admin/users/', { params: { ...params, export: 'csv' }, responseType: 'blob' }),
  getAdminPayments: (params) => api.get('/billing/admin/payments/', { params }),
  approvePayment: (paymentId, data) => api.post(`/billing/admin/payments/${paymentId}/approve/`, data),
  rejectPayment: (paymentId, data) => api.post(`/billing/admin/payments/${paymentId}/reject/`, data),
  getSubscriptionHistory: (userId) => api.get(`/billing/admin/subscriptions/${userId}/history/`),
  extendSubscription: (userId, data) => api.post(`/billing/admin/subscriptions/${userId}/extend/`, data),
  revokeSubscription: (userId) => api.post(`/billing/admin/subscriptions/${userId}/revoke/`),
  getActivityLogs: () => api.get('/billing/admin/activity/'),
}

// Personal Finance API (separate from business)
export const personalFinanceAPI = {
  getTransactions: (params) => api.get('/personal/transactions/', { params }),
  getOne: (id) => api.get(`/personal/transactions/${id}/`),
  create: (data) => api.post('/personal/transactions/', data),
  update: (id, data) => api.put(`/personal/transactions/${id}/`, data),
  delete: (id) => api.delete(`/personal/transactions/${id}/`),
  getSummary: (params) => api.get('/personal/transactions/summary/', { params }),
  getDashboard: (params) => api.get('/personal/transactions/dashboard/', { params }),
  getCategories: () => api.get('/personal/transactions/categories/'),
  getTypes: () => api.get('/personal/transactions/types/'),
}

// AI proxy API (server-side) — frontend should never include the key
export const aiAPI = {
  query: (payload) => api.post('/analytics/ai-query/', payload),
}

// Chat API
export const chatAPI = {
  sendMessage: (message) => api.post('/chat/', { message }),
}

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications/'),
  getUnread: () => api.get('/notifications/unread/'),
  getUnreadCount: () => api.get('/notifications/unread_count/'),
  markRead: (id) => api.patch(`/notifications/${id}/mark_read/`),
  markAllRead: () => api.post('/notifications/mark_all_read/'),
  delete: (id) => api.delete(`/notifications/${id}/`),
}

export default api
