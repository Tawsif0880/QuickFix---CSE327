import api from './api'

export const emergencyService = {
  async createEmergencyJob(jobData) {
    const response = await api.post('/emergency/jobs', jobData)
    return response.data
  }
}

export default emergencyService
