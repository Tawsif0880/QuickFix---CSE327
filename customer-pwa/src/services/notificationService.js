import api from './api'

export const notificationService = {
  async getNotifications(unreadOnly = false) {
    const params = unreadOnly ? { unread_only: 'true' } : {}
    const response = await api.get('/customer/notifications', { params })
    return response.data
  },

  async markAsRead(notificationId) {
    const response = await api.put(`/customer/notifications/${notificationId}/read`)
    return response.data
  },

  async markAllAsRead() {
    const response = await api.put('/customer/notifications/read-all')
    return response.data
  },

  async getUnreadCount() {
    const response = await api.get('/customer/notifications/unread-count')
    return response.data
  }
}

