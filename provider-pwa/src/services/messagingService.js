import api from './api'

export const messagingService = {
  async getConversations() {
    const response = await api.get('/provider/conversations')
    return response.data
  },

  async getMessages(conversationId) {
    const response = await api.get(`/provider/conversations/${conversationId}/messages`)
    return response.data
  },

  async sendMessage(conversationId, content) {
    const response = await api.post(`/provider/conversations/${conversationId}/messages`, {
      content
    })
    return response.data
  }
}

