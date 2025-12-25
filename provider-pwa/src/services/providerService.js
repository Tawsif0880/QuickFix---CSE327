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
  },

  async redeemCredits(amount, method) {
    const response = await api.post('/provider/credits/redeem', {
      amount,
      method
    })
    return response.data
  },

  async getUpcomingCalls() {
    const response = await api.get('/provider/upcoming-calls')
    return response.data
  },

  async getCustomerProfile(customerId) {
    const response = await api.get(`/provider/customers/${customerId}/profile`)
    return response.data
  },

  async toggleEmergency(active) {
    const response = await api.post('/provider/emergency/toggle', {
      emergency_active: active
    })
    return response.data
  },

  async toggleAvailability(isAvailable) {
    const response = await api.post('/provider/availability', {
      is_available: isAvailable
    })
    return response.data
  },

  async purchaseCredits(amount, paymentMethod) {
    const response = await api.post('/provider/credits/purchase', {
      amount,
      payment_method: paymentMethod
    })
    return response.data
  }
}

