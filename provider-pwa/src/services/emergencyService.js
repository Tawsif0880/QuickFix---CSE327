import api from './api'

export const emergencyService = {
  async getEmergencyRequests() {
    const response = await api.get('/provider/emergency/requests')
    return response.data
  },

  async acceptEmergencyJob(jobId) {
    const response = await api.post(`/provider/emergency/jobs/${jobId}/accept`)
    return response.data
  },

  async getEmergencyJobs() {
    const response = await api.get('/provider/emergency/jobs')
    return response.data
  },

  async createEmergencyJob(jobData) {
    const response = await api.post('/emergency/jobs', jobData)
    return response.data
  }
}

export default emergencyService
