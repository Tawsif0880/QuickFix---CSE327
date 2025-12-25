import api from './api'

export const providerService = {
  async getProfile() {
    const response = await api.get('/provider/profile')
    return response.data
  },

  async updateProfile(updates) {
    const response = await api.put('/provider/profile', updates)
    return response.data
  },

  async getStats() {
    const response = await api.get('/provider/stats')
    return response.data
  }
}

