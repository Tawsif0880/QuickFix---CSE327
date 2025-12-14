import api from './api'

export const userService = {
  async getProfile() {
    const response = await api.get('/users/profile')
    return response.data
  },

  async updateProfile(updates) {
    const response = await api.put('/users/profile', updates)
    return response.data
  },

  async changePassword(currentPassword, newPassword) {
    // Note: This endpoint may need to be created in the backend
    // For now, we'll use a placeholder endpoint
    const response = await api.put('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    })
    return response.data
  },

  async uploadProfilePicture(file) {
    const formData = new FormData()
    formData.append('picture', file)
    
    const response = await api.post('/users/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  async getCreditBalance() {
    const response = await api.get('/credits/balance')
    return response.data
  },

  async purchaseCredits(amount, paymentMethod) {
    const response = await api.post('/credits/purchase', {
      amount,
      payment_method: paymentMethod
    })
    return response.data
  }
}

