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
  const [customerMessageCount, setCustomerMessageCount] = useState(0)
  const [nextCreditDeductionAt, setNextCreditDeductionAt] = useState(3)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingMessage, setPendingMessage] = useState('')
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
        
        // Update message count and credits if this was our message
        if (messageData.sender_id === user?.id) {
          if (messageData.customer_message_count !== undefined) {
            setCustomerMessageCount(messageData.customer_message_count)
            setNextCreditDeductionAt(messageData.next_credit_deduction_at || ((Math.floor(messageData.customer_message_count / 3) + 1) * 3))
          }
          if (messageData.remaining_credits !== undefined) {
            setCredits(messageData.remaining_credits)
            updateUser()
          }
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
    // Calculate credits needed for 3 messages based on provider rating
    if (provider) {
      const rating = provider.rating_avg
      let creditsFor3Messages = 0
      // Handle null, undefined, or 0.0 as NA (6 credits for 3 messages)
      if (rating === null || rating === undefined || rating === 0.0) {
        creditsFor3Messages = 6 // NA
      } else if (rating >= 4.5) {
        creditsFor3Messages = 6 // 6 credits for 3 messages
      } else if (rating >= 4.0) {
        creditsFor3Messages = 4 // 4 credits for 3 messages
      } else if (rating >= 3.0) {
        creditsFor3Messages = 3 // 3 credits for 3 messages
      } else {
        creditsFor3Messages = 2 // 2 credits for 3 messages
      }
      setCreditsNeeded(creditsFor3Messages)
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
      if (data.customer_message_count !== undefined) {
        setCustomerMessageCount(data.customer_message_count)
        setNextCreditDeductionAt(data.next_credit_deduction_at || ((Math.floor(data.customer_message_count / 3) + 1) * 3))
      }
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!messageContent.trim() || !conversation) return

    // Check if this will be the 3rd, 6th, 9th, etc. message (triggers credit deduction)
    const nextMessageCount = customerMessageCount + 1
    const willTriggerCreditDeduction = nextMessageCount % 3 === 0

    // Check if user has enough credits for 3 messages
    if (willTriggerCreditDeduction && credits < creditsNeeded) {
      setError(`Insufficient credits. You need ${creditsNeeded} credits to send 3 messages. You have ${credits} credits.`)
      return
    }

    // Show confirmation dialog before deducting credits
    if (willTriggerCreditDeduction) {
      setPendingMessage(messageContent.trim())
      setShowConfirmDialog(true)
      return
    }

    // Send message immediately if no credit deduction
    await sendMessage(messageContent.trim())
  }

  const sendMessage = async (content) => {
    if (!content || !conversation) return

    setSending(true)
    setError(null)
    setShowConfirmDialog(false)

    try {
      // Use REST API for credit deduction
      const response = await messagingService.sendMessage(conversation.id, content)
      
      // Message will be added via Socket.IO event
      setMessageContent('')
      
      // Update message count
      if (response.customer_message_count !== undefined) {
        setCustomerMessageCount(response.customer_message_count)
        setNextCreditDeductionAt(response.next_credit_deduction_at || ((Math.floor(response.customer_message_count / 3) + 1) * 3))
      }
      
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

  const handleConfirmSend = () => {
    if (pendingMessage) {
      sendMessage(pendingMessage)
    }
  }

  const handleCancelSend = () => {
    setShowConfirmDialog(false)
    setPendingMessage('')
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
      {credits < creditsNeeded && (customerMessageCount + 1) % 3 === 0 && (
        <div className="credit-warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>You need {creditsNeeded} credits to send 3 messages. You have {credits} credits.</span>
          <Button 
            variant="primary" 
            size="small"
            onClick={() => navigate('/buy-credits')}
          >
            Buy Credits
          </Button>
        </div>
      )}

      {/* Message Count Info */}
      {customerMessageCount > 0 && (
        <div className="message-count-info">
          <span>Messages sent: {customerMessageCount}. Next credit deduction at message {nextCreditDeductionAt}.</span>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h3>Confirm Credit Deduction</h3>
            <p>
              This will be your {customerMessageCount + 1} message{customerMessageCount + 1 !== 1 ? 's' : ''}. Sending this message will deduct <strong>{creditsNeeded} credits</strong> for 3 messages.
            </p>
            <p>
              Your current balance: <strong>{credits} credits</strong>
            </p>
            <p>
              Balance after deduction: <strong>{credits - creditsNeeded} credits</strong>
            </p>
            <div className="confirm-dialog-actions">
              <Button variant="secondary" onClick={handleCancelSend}>
                Cancel
              </Button>
              <Button onClick={handleConfirmSend} disabled={sending}>
                {sending ? 'Sending...' : 'Confirm & Send'}
              </Button>
            </div>
          </div>
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
          placeholder={
            (customerMessageCount + 1) % 3 === 0 && credits < creditsNeeded
              ? `Need ${creditsNeeded} credits for 3 messages`
              : "Type a message..."
          }
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          disabled={sending || ((customerMessageCount + 1) % 3 === 0 && credits < creditsNeeded)}
        />
        <button
          type="submit"
          className="chat-send-button"
          disabled={!messageContent.trim() || sending || ((customerMessageCount + 1) % 3 === 0 && credits < creditsNeeded)}
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

