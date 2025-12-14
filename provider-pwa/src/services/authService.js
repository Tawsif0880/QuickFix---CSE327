import api from './api'

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', {
      email: userData.email,
      password: userData.password,
      role: 'provider',
      name: `${userData.firstName} ${userData.lastName}`.trim(),
      phone: userData.contactNumber,
      category: userData.profession || '',
      description: userData.experience || '',
      service_area: userData.serviceArea || '',
      hourly_rate: userData.hourlyRate || null
    })
    return response.data
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  },

  async refreshToken() {
    const response = await api.post('/auth/refresh')
    return response.data
  }
}

