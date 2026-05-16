import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
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
        window.location.href = '/login'
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
  getProfile: () => api.get('/auth/me/'),
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
