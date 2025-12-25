import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import chatService from '../services/chatService'
import './ChatBotWidget.css'

const ChatBotWidget = () => {
  const { user, token } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [currentStage, setCurrentStage] = useState(null)
  const [messages, setMessages] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [showProviderOffer, setShowProviderOffer] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const messagesEndRef = useRef(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleOpen = () => {
    setIsOpen(true)
    
    // Check if user is logged in
    if (!token) {
      setError('Please sign in to use the AI chatbot')
      setMessages([{
        type: 'bot',
        content: '👋 Hello! To use the AI diagnosis feature, please sign in to your account first.'
      }])
      return
    }
    
    if (!sessionId) {
      startDiagnosis()
    }
  }

  const startDiagnosis = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await chatService.startDiagnosis()
      console.log('Start diagnosis response:', response)
      
      if (response.success) {
        setSessionId(response.session_id)
        setCurrentStage(response.stage)
        setMessages([{ type: 'bot', content: response.message }])
        setShowCategories(true)
        
        // Load categories
        await loadCategories(response.session_id)
      } else {
        throw new Error(response.error || 'Failed to start diagnosis')
      }
    } catch (err) {
      console.error('Start diagnosis error:', err)
      const errorMessage = err.response?.data?.msg || err.message || 'Failed to start diagnosis. Please try again.'
      setError(errorMessage)
      setMessages([{
        type: 'bot',
        content: '❌ ' + errorMessage
      }])
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async (id) => {
    try {
      const response = await chatService.getCategories(id)
      console.log('Categories response:', response)
      
      if (response.success && response.options) {
        setCategories(response.options)
      } else {
        console.error('Invalid categories response:', response)
        setCategories([])
        setError('Failed to load service categories')
      }
    } catch (err) {
      console.error('Failed to load categories:', err)
      setCategories([])
      setError('Failed to load service categories. Please refresh and try again.')
    }
  }

  const handleSelectCategory = async (categoryKey) => {
    try {
      setLoading(true)
      setError(null)

      setSelectedCategory(categoryKey)
      setShowCategories(false)
      
      const categoryName = categories.find(c => c.key === categoryKey)?.name || categoryKey
      setMessages((prev) => [
        ...prev,
        { type: 'user', content: `I need help with ${categoryName}` }
      ])

      const response = await chatService.setCategory(sessionId, categoryKey)
      if (response.success) {
        setCurrentStage(response.stage)
        setMessages((prev) => [...prev, { type: 'bot', content: response.message }])
      }
    } catch (err) {
      setError(err.message || 'Failed to select category')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitMessage = async () => {
    const text = inputText.trim()
    if (!text) return

    console.log('📤 Sending message:', text, 'Stage:', currentStage)

    try {
      setLoading(true)
      setError(null)

      // Add user message to display
      setMessages((prev) => [...prev, { type: 'user', content: text }])
      setInputText('')

      // Determine which API call to make based on stage
      if (currentStage === 'problem_description') {
        console.log('📞 API: setProblem')
        const response = await chatService.setProblem(sessionId, text)
        console.log('📨 Response:', response)
        
        if (response.success) {
          setCurrentStage(response.stage)
          setMessages((prev) => [...prev, { type: 'bot', content: response.message }])
        } else {
          throw new Error(response.error || 'Failed to set problem')
        }
      } else if (currentStage === 'detailed_situation') {
        console.log('📞 API: analyzeAndGetRecommendation')
        const response = await chatService.analyzeAndGetRecommendation(sessionId, text)
        console.log('📨 Response:', response)
        
        if (response.success) {
          setCurrentStage(response.stage)
          // Store the analysis data from response root level
          const analysisData = {
            severity: response.severity,
            diagnosis: response.diagnosis,
            diy_solutions: response.diy_solutions,
            risk_assessment: response.risk_assessment,
            professional_needed: response.professional_needed
          }
          setAnalysis(analysisData)

          const analysisText = `✅ **Analysis Complete**

**Severity**: ${response.severity.toUpperCase()}
${response.urgency_level ? `**Urgency**: ${response.urgency_level.replace('_', ' ').toUpperCase()}` : ''}
${response.estimated_time ? `**Estimated Time**: ${response.estimated_time}` : ''}

**Professional Help**: ${response.professional_needed ? '✅ Recommended' : '⚠️ Optional'}
${response.explanation ? `\n${response.explanation}` : ''}

${response.professional_needed ? 'I recommend hiring a professional to ensure this is handled safely and correctly.' : 'You may be able to handle this yourself, but professional help is available if needed.'}`

          setMessages((prev) => [...prev, { type: 'bot', content: analysisText }])
          setShowProviderOffer(true)
        } else {
          // Handle API errors gracefully
          throw new Error(response.error || 'Failed to analyze situation')
        }
      } else {
        console.warn('⚠️ Unknown stage:', currentStage)
        throw new Error('Invalid conversation stage')
      }
    } catch (err) {
      console.error('❌ Error:', err)
      const errorMessage = err.message || 'Failed to send message'
      setError(errorMessage)
      setMessages((prev) => prev.slice(0, -1))
      
      // Add error message to chat
      if (errorMessage.includes('Rate limit') || errorMessage.includes('quota')) {
        setMessages((prev) => [
          ...prev,
          {
            type: 'bot',
            content: '⚠️ Our AI is experiencing high traffic. Please wait a moment and try again.'
          }
        ])
      } else if (errorMessage.includes('API key')) {
        setMessages((prev) => [
          ...prev,
          {
            type: 'bot',
            content: '⚠️ AI service is temporarily unavailable. Please try again later or contact support.'
          }
        ])
      } else {
        // Show generic error
        setMessages((prev) => [
          ...prev,
          {
            type: 'bot',
            content: `❌ Error: ${errorMessage}. Please try again.`
          }
        ])
      }
      
      setInputText(text)
    } finally {
      setLoading(false)
      console.log('✅ Message handling complete')
    }
  }

  const handleHireProvider = () => {
    window.location.href = `/providers?category=${selectedCategory}`
  }

  const handleNewDiagnosis = () => {
    setSessionId(null)
    setMessages([])
    setCurrentStage(null)
    setSelectedCategory(null)
    setAnalysis(null)
    setShowProviderOffer(false)
    setShowCategories(false)
    setInputText('')
    startDiagnosis()
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <div className="chatbot-widget-container">
      {/* Floating Button */}
      {!isOpen && (
        <button className="chatbot-toggle-btn" onClick={handleOpen} title="Start AI Diagnosis">
          <span className="chatbot-icon">🤖</span>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className={`chatbot-widget ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <h3>🤖 QuickFix AI Diagnosis</h3>
              <p className="chatbot-subtitle">Chat with AI to diagnose your problem</p>
            </div>
            <div className="chatbot-header-actions">
              <button
                className="chatbot-minimize-btn"
                onClick={() => setIsMinimized(!isMinimized)}
                title="Minimize"
              >
                {isMinimized ? '📲' : '−'}
              </button>
              <button className="chatbot-close-btn" onClick={handleClose} title="Close">
                ✕
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="chatbot-main-content">
              {/* Loading Overlay */}
              {loading && (
                <div className="chatbot-loading-overlay">
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>AI is thinking...</p>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="chatbot-messages">
                {messages.map((msg, index) => (
                  <div key={index} className={`chatbot-message ${msg.type}`}>
                    <div className="chatbot-message-avatar">
                      {msg.type === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="chatbot-message-content">{msg.content}</div>
                  </div>
                ))}

                {loading && (
                  <div className="chatbot-message bot">
                    <div className="chatbot-message-avatar">🤖</div>
                    <div className="chatbot-typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Error Display */}
              {error && <div className="chatbot-error">{error}</div>}

              {/* Category Selection Panel */}
              {showCategories && (
                <div className="chatbot-categories-panel">
                  {categories.map((cat) => (
                    <button
                      key={cat.key}
                      className="chatbot-category-btn"
                      onClick={() => handleSelectCategory(cat.key)}
                      disabled={loading}
                    >
                      <span className="category-icon">{cat.icon}</span>
                      <span className="category-name">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Analysis Display Panel */}
              {analysis && (
                <div className="chatbot-analysis-panel">
                  <div className="analysis-section">
                    <div className="analysis-row">
                      <span className="analysis-label">Severity:</span>
                      <span className={`severity-badge severity-${analysis.severity.toLowerCase()}`}>
                        {analysis.severity}
                      </span>
                    </div>
                  </div>

                  {analysis.diagnosis?.analysis && (
                    <div className="analysis-section">
                      <div className="analysis-label">Diagnosis:</div>
                      <div className="analysis-text">{analysis.diagnosis.analysis}</div>
                    </div>
                  )}

                  {analysis.diy_solutions && analysis.diy_solutions.length > 0 && (
                    <div className="analysis-section">
                      <div className="analysis-label">💡 DIY Solutions:</div>
                      <ul className="analysis-list">
                        {analysis.diy_solutions.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.risk_assessment && analysis.risk_assessment.length > 0 && (
                    <div className="analysis-section">
                      <div className="analysis-label">⚠️ Potential Risks:</div>
                      <div className="analysis-text">{analysis.risk_assessment.join(', ')}</div>
                    </div>
                  )}

                  {showProviderOffer && (
                    <div className="analysis-actions">
                      <button
                        className="action-btn hire-btn"
                        onClick={handleHireProvider}
                      >
                        👨‍🔧 Hire a Professional
                      </button>
                      <button
                        className="action-btn restart-btn"
                        onClick={handleNewDiagnosis}
                      >
                        � New Diagnosis
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Input Area - Always visible when chatting */}
              {currentStage && !showCategories && (
                <div className="chatbot-input-section">
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="chatbot-input"
                      placeholder={
                        currentStage === 'problem_description'
                          ? 'Describe your problem...'
                          : currentStage === 'detailed_situation'
                          ? 'Provide more details...'
                          : 'Type your message...'
                      }
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSubmitMessage()
                        }
                      }}
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      className="chatbot-send-btn"
                      onClick={handleSubmitMessage}
                      disabled={!inputText.trim() || loading}
                      title={loading ? 'Sending...' : 'Send message (Enter)'}
                    >
                      {loading ? '⏳' : '📤'}
                    </button>
                  </div>
                  {loading && (
                    <div className="input-loading">
                      <span className="loading-dots">Processing</span>
                    </div>
                  )}
                  {!loading && (
                    <div className="input-hint">
                      Press Enter to send your message
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ChatBotWidget