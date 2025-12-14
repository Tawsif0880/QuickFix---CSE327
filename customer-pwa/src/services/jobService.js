import api from './api'

export const jobService = {
  async createServiceRequest(data) {
    const response = await api.post('/customer/service-requests', data)
    return response.data
  },

  async getMyRequests() {
    const response = await api.get('/customer/requests')
    return response.data
  },

  async getRequestDetails(requestId) {
    const response = await api.get(`/customer/requests/${requestId}`)
    return response.data
  }
}

export default jobService
