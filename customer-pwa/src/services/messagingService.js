import api from './api'

export const messagingService = {
  async getConversations() {
    const response = await api.get('/customer/conversations')
    return response.data
  },

  async startConversation(providerId) {
    const response = await api.post('/customer/conversations', { provider_id: providerId })
    return response.data
  },

  async getMessages(conversationId) {
    const response = await api.get(`/customer/conversations/${conversationId}/messages`)
    return response.data
  },

  async sendMessage(conversationId, content) {
    const response = await api.post(`/customer/conversations/${conversationId}/messages`, {
      content
    })
    return response.data
  }
}

