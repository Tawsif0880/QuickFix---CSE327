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
  },

  async getRequestedJobs() {
    const response = await api.get('/provider/jobs/requested-jobs')
    return response.data
  },

  async acceptRequestedJob(jobId) {
    const response = await api.post(`/provider/jobs/requested-jobs/${jobId}/accept`)
    return response.data
  },

  async rejectRequestedJob(jobId) {
    const response = await api.post(`/provider/jobs/requested-jobs/${jobId}/reject`)
    return response.data
  },

  async completeJob(jobId) {
    const response = await api.post(`/provider/jobs/${jobId}/complete`)
    return response.data
  },

  async reportCustomer(jobId, reason = '') {
    const response = await api.post(`/provider/jobs/${jobId}/report`, { reason })
    return response.data
  },

  async getJobHistory() {
    const response = await api.get('/provider/jobs/history')
    return response.data
  }
}

export default jobService
