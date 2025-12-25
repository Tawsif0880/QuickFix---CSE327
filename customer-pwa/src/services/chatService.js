import api from './api'

const CHAT_API_URL = '/bot'

const chatService = {
  // ==================== DIAGNOSIS FLOW ====================
  
  /**
   * Start a new problem diagnosis session
   */
  async startDiagnosis() {
    try {
      const response = await api.post(`${CHAT_API_URL}/diagnose/start`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to start diagnosis')
    }
  },

  /**
   * Get service categories
   */
  async getCategories(sessionId) {
    try {
      const response = await api.get(`${CHAT_API_URL}/diagnose/${sessionId}/categories`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get categories')
    }
  },

  /**
   * Set service category
   */
  async setCategory(sessionId, category) {
    try {
      const response = await api.post(`${CHAT_API_URL}/diagnose/${sessionId}/set-category`, {
        category: category
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to set category')
    }
  },

  /**
   * Set problem description
   */
  async setProblem(sessionId, description) {
    try {
      const response = await api.post(`${CHAT_API_URL}/diagnose/${sessionId}/set-problem`, {
        description: description
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to set problem')
    }
  },

  /**
   * Analyze situation and get recommendation
   */
  async analyzeAndGetRecommendation(sessionId, details) {
    try {
      const response = await api.post(`${CHAT_API_URL}/diagnose/${sessionId}/analyze`, {
        details: details
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to analyze situation')
    }
  },

  /**
   * Get provider recommendation
   */
  async getRecommendation(sessionId) {
    try {
      const response = await api.get(`${CHAT_API_URL}/diagnose/${sessionId}/recommendation`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get recommendation')
    }
  },

  // ==================== LEGACY CHAT SESSION ====================

  /**
   * Check if chatbot service is available
   */
  async checkHealth() {
    try {
      const response = await api.get(`${CHAT_API_URL}/health`)
      return response.data
    } catch (error) {
      return {
        status: 'error',
        message: 'Chatbot service unavailable'
      }
    }
  },

  /**
   * Get all chat sessions for the current user
   */
  async getSessions() {
    try {
      const response = await api.get(`${CHAT_API_URL}/sessions`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch sessions')
    }
  },

  /**
   * Get a specific chat session
   */
  async getSession(sessionId) {
    try {
      const response = await api.get(`${CHAT_API_URL}/sessions/${sessionId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch session')
    }
  },

  /**
   * Create a new chat session
   */
  async createSession(contextType = 'general', title = null) {
    try {
      const data = {
        context_type: contextType
      }
      if (title) {
        data.title = title
      }
      const response = await api.post(`${CHAT_API_URL}/sessions`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create session')
    }
  },

  /**
   * Send a message in a chat session
   */
  async sendMessage(sessionId, message) {
    try {
      const response = await api.post(`${CHAT_API_URL}/sessions/${sessionId}/message`, {
        message: message
      })
      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.details || 'Failed to send message'
      throw new Error(errorMsg)
    }
  },

  /**
   * Delete a chat session
   */
  async deleteSession(sessionId) {
    try {
      const response = await api.delete(`${CHAT_API_URL}/sessions/${sessionId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete session')
    }
  },

  /**
   * Get quick response without creating a session
   */
  async getQuickResponse(prompt) {
    try {
      const response = await api.post(`${CHAT_API_URL}/quick-response`, {
        prompt: prompt
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get response')
    }
  },

  /**
   * Get information about available contexts
   */
  async getContextInfo() {
    try {
      const response = await api.get(`${CHAT_API_URL}/context-info`)
      return response.data
    } catch (error) {
      return {
        contexts: {
          general: 'General assistance',
          service: 'Service information',
          booking: 'Booking help',
          support: 'Customer support'
        }
      }
    }
  }
}

export default chatService
