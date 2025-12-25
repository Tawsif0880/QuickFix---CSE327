import api from './api'

export const providerService = {
  async searchProviders(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.name) params.append('name', filters.name)
    if (filters.location) params.append('location', filters.location)
    if (filters.rating) params.append('min_rating', filters.rating)
    if (filters.category) params.append('category', filters.category)
    if (filters.min_rating) params.append('min_rating', filters.min_rating)
    if (filters.max_price) params.append('max_price', filters.max_price)
    if (filters.available_only) params.append('available_only', 'true')
    if (filters.lat) params.append('lat', filters.lat)
    if (filters.lng) params.append('lng', filters.lng)
    if (filters.radius) params.append('radius', filters.radius)
    
    const response = await api.get(`/providers/search?${params.toString()}`)
    return response.data
  },

  async getProviderDetails(providerId) {
    const response = await api.get(`/providers/${providerId}`)
    return response.data
  },

  async getNearbyProviders(lat, lng, radius = 50) {
    const response = await api.get(`/providers/nearby?lat=${lat}&lng=${lng}&radius=${radius}`)
    return response.data
  },

  async startConversation(providerId) {
    const response = await api.post('/customer/conversations', { provider_id: providerId })
    return response.data
  },

  async revealContact(providerId) {
    const response = await api.post(`/providers/${providerId}/reveal-contact`)
    return response.data
  }
}

export async function searchProviders(filters) {
  return providerService.searchProviders(filters)
}

