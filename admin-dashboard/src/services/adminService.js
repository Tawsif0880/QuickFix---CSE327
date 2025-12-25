import api from './api'

export const adminService = {
  async getDashboardStats() {
    const response = await api.get('/admin/dashboard')
    return response.data
  },

  async getUsers(page = 1, perPage = 20, role = null) {
    const params = { page, per_page: perPage }
    if (role) params.role = role
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  async getJobs(page = 1, perPage = 20, status = null) {
    const params = { page, per_page: perPage }
    if (status) params.status = status
    const response = await api.get('/admin/jobs', { params })
    return response.data
  },

  async getChats(page = 1, perPage = 50, conversationId = null) {
    const params = { page, per_page: perPage }
    if (conversationId) params.conversation_id = conversationId
    const response = await api.get('/admin/chats', { params })
    return response.data
  },

  async verifyProvider(providerId) {
    const response = await api.post(`/admin/providers/${providerId}/verify`)
    return response.data
  },

  async suspendUser(userId, suspend = true) {
    const response = await api.post(`/admin/users/${userId}/suspend`, { suspend })
    return response.data
  },

  async flagJob(jobId, reason = '') {
    const response = await api.post(`/admin/jobs/${jobId}/flag`, { reason })
    return response.data
  }
}

