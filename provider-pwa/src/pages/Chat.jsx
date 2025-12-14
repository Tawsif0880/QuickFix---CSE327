import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components'
import { messagingService } from '../services/messagingService'
import { io } from 'socket.io-client'
import './Chat.css'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

const Chat = () => {
  const navigate = useNavigate()
  const { conversationId } = useParams()
  const { user } = useAuth()
  const [conversation, setConversation] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageContent, setMessageContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    loadConversation()
  }, [conversationId])

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
    })
    
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversation = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get all conversations and find the one we need
      const response = await messagingService.getConversations()
      const foundConv = response.conversations?.find(c => c.id === parseInt(conversationId))
      
      if (!foundConv) {
        setError('Conversation not found')
        return
      }
      
      setConversation(foundConv)
      setCustomer(foundConv.customer)
    } catch (err) {
      console.error('Error loading conversation:', err)
      setError(err.response?.data?.error || 'Failed to load conversation')
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

    setSending(true)
    setError(null)

    try {
      // Use REST API (providers don't pay credits)
      const response = await messagingService.sendMessage(conversation.id, messageContent.trim())
      setMessageContent('')
      // Message will be added via Socket.IO event
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message')
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

  if (error && !conversation) {
    return (
      <div className="chat-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate(-1)}>Go Back</button>
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
          <div className="chat-customer-name">{customer?.name || 'Customer'}</div>
        </div>
        
        <div style={{ width: '24px' }}></div>
      </div>

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
            const isProvider = message.sender_id === user?.id
            return (
              <div
                key={message.id}
                className={`message ${isProvider ? 'message-sent' : 'message-received'}`}
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
          placeholder="Type a message..."
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          className="chat-send-button"
          disabled={!messageContent.trim() || sending}
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

