import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo, Button } from '../components'
import { messagingService } from '../services/messagingService'
import { providerService } from '../services/providerService'
import { userService } from '../services/userService'
import { io } from 'socket.io-client'
import './Chat.css'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

const Chat = () => {
  const navigate = useNavigate()
  const { providerId } = useParams()
  const { user, updateUser } = useAuth()
  const [provider, setProvider] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageContent, setMessageContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [credits, setCredits] = useState(user?.profile?.credits || 35)
  const [creditsNeeded, setCreditsNeeded] = useState(0)
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    loadProviderAndConversation()
    loadCreditBalance()
  }, [providerId])

  useEffect(() => {
    if (conversation) {
      loadMessages()
      setupSocket()
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [conversation])
  
  const setupSocket = () => {
    if (!conversation || !user) return
    
    const token = localStorage.getItem('token')
    if (!token) return
    
    // Connect to Socket.IO
    socketRef.current = io(SOCKET_URL, {
      auth: { token }
    })
    
    // Join conversation room
    socketRef.current.emit('join_conversation', {
      conversation_id: conversation.id,
      token
    })
    
    // Join user room for unread count updates
    socketRef.current.emit('join_user_room', { token })
    
    // Listen for new messages
    socketRef.current.on('message', (messageData) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === messageData.id)) {
          return prev
        }
        return [...prev, messageData]
      })
      
      // Update credits if this was our message
      if (messageData.remaining_credits !== undefined) {
        setCredits(messageData.remaining_credits)
        updateUser()
      }
    })
    
    // Listen for unread count updates
    socketRef.current.on('unread_count_update', (data) => {
      // This will be handled by Messages page
      // For now, we can ignore or update local state if needed
    })
    
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Calculate credits needed based on provider rating
    if (provider) {
      const rating = provider.rating_avg
      // Handle null, undefined, or 0.0 as NA (6 credits)
      if (rating === null || rating === undefined || rating === 0.0) {
        setCreditsNeeded(6) // NA
      } else if (rating >= 4.5) {
        setCreditsNeeded(6)
      } else if (rating >= 4.0) {
        setCreditsNeeded(4)
      } else if (rating >= 3.0) {
        setCreditsNeeded(2.5)
      } else {
        setCreditsNeeded(1)
      }
    }
  }, [provider])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadCreditBalance = async () => {
    try {
      const balance = await userService.getCreditBalance()
      setCredits(balance.credits)
    } catch (error) {
      console.error('Error loading credit balance:', error)
    }
  }

  const loadProviderAndConversation = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load provider details
      const providerData = await providerService.getProviderDetails(providerId)
      setProvider(providerData)

      // Start or get existing conversation
      let conversationData
      try {
        conversationData = await messagingService.startConversation(providerId)
        setConversation(conversationData.conversation || conversationData)
      } catch (err) {
        if (err.response?.status === 200) {
          // Conversation already exists
          conversationData = err.response.data
          setConversation(conversationData.conversation || conversationData)
        } else {
          throw err
        }
      }
    } catch (err) {
      console.error('Error loading provider/conversation:', err)
      setError(err.response?.data?.error || 'Failed to load chat')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    if (!conversation) return

    try {
      const data = await messagingService.getMessages(conversation.id)
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!messageContent.trim() || !conversation) return

    // Check if user has enough credits
    if (credits < creditsNeeded) {
      setError(`Insufficient credits. You need ${creditsNeeded} credits to send this message. You have ${credits} credits.`)
      return
    }

    setSending(true)
    setError(null)

    try {
      // Use REST API for credit deduction (Socket.IO handler also supports it, but REST is more reliable)
      const response = await messagingService.sendMessage(conversation.id, messageContent.trim())
      
      // Message will be added via Socket.IO event, but we can add it optimistically
      setMessageContent('')
      
      // Update credits if deducted
      if (response.credits_deducted) {
        setCredits(response.remaining_credits)
        await updateUser()
      }
    } catch (err) {
      if (err.response?.status === 402) {
        // Insufficient credits
        const errorData = err.response.data
        setError(errorData.message || 'Insufficient credits')
        setCredits(errorData.available || credits)
      } else {
        setError(err.response?.data?.error || 'Failed to send message')
      }
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="chat-container">
        <div className="loading">Loading chat...</div>
      </div>
    )
  }

  if (error && !provider) {
    return (
      <div className="chat-container">
        <div className="error-message">{error}</div>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="chat-container">
      {/* Top Bar */}
      <div className="chat-topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <div className="chat-header-info">
          <div className="chat-provider-name">{provider?.name || 'Provider'}</div>
          <div className="chat-provider-category">{provider?.category || ''}</div>
        </div>
        
        <div className="chat-credits-display">
          <span className="credits-label">Credits:</span>
          <span className={`credits-amount ${credits < creditsNeeded ? 'low' : ''}`}>
            {credits}
          </span>
        </div>
      </div>

      {/* Credit Warning */}
      {credits < creditsNeeded && (
        <div className="credit-warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>You need {creditsNeeded} credits to send a message. You have {credits} credits.</span>
          <Button 
            variant="primary" 
            size="small"
            onClick={() => navigate('/buy-credits')}
          >
            Buy Credits
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="chat-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCustomer = message.sender_id === user?.id
            return (
              <div
                key={message.id}
                className={`message ${isCustomer ? 'message-sent' : 'message-received'}`}
              >
                <div className="message-content">{message.content}</div>
                <div className="message-time">
                  {new Date(message.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder={credits >= creditsNeeded ? "Type a message..." : `Need ${creditsNeeded} credits to send`}
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          disabled={sending || credits < creditsNeeded}
        />
        <button
          type="submit"
          className="chat-send-button"
          disabled={!messageContent.trim() || sending || credits < creditsNeeded}
        >
          {sending ? (
            <span>Sending...</span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </form>
    </div>
  )
}

export default Chat

