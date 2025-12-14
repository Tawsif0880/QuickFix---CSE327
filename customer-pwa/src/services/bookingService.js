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
  }
}

export default bookingService
