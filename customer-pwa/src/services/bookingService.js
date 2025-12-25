import api from './api'

export const bookingService = {
  async getMyBookings(status = null) {
    const params = status ? `?status=${status}` : ''
    const response = await api.get(`/bookings${params}`)
    return response.data
  },

  async getBookingDetails(bookingId) {
    const response = await api.get(`/bookings/${bookingId}`)
    return response.data
  },

  async updateBookingStatus(bookingId, status) {
    const response = await api.put(`/bookings/${bookingId}/status`, { status })
    return response.data
  },

  async getBookingHistory() {
    const response = await api.get('/bookings/history')
    return response.data
  },

  async submitJobRating(jobId, rating, reviewText = '') {
    const response = await api.post(`/ratings/jobs/${jobId}`, {
      rating,
      review_text: reviewText
    })
    return response.data
  },

  async getJobRatingStatus(jobId) {
    const response = await api.get(`/ratings/jobs/${jobId}`)
    return response.data
  }
}

export default bookingService
