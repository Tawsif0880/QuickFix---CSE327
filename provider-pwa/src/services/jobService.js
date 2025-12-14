import api from './api'

export const jobService = {
  async getOpenJobs() {
    const response = await api.get('/provider/jobs/open')
    return response.data
  },

  async acceptJob(jobId) {
    const response = await api.post(`/provider/jobs/${jobId}/accept`)
    return response.data
  },

  async saveJob(jobId) {
    const response = await api.post(`/provider/jobs/${jobId}/save`)
    return response.data
  },

  async getSavedJobs() {
    const response = await api.get('/provider/jobs/saved')
    return response.data
  },

  async getAcceptedJobs() {
    const response = await api.get('/provider/jobs/accepted')
    return response.data
  }
}

export default jobService
