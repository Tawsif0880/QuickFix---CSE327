import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components'
import { messagingService } from '../services/messagingService'
import { io } from 'socket.io-client'
import './Messages.css'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

const Messages = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    loadConversations()
    setupSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const setupSocket = () => {
    const token = localStorage.getItem('token')
    if (!token) return

    socketRef.current = io(SOCKET_URL, {
      auth: { token }
    })

    // Join user room for unread count updates
    socketRef.current.emit('join_user_room', { token })

    // Listen for unread count updates
    socketRef.current.on('unread_count_update', (data) => {
      setConversations(prev => prev.map(conv => {
        if (conv.id === data.conversation_id) {
          return { ...conv, unread_count: data.unread_count }
        }
        return conv
      }))
    })

    // Listen for new messages (update last message)
    socketRef.current.on('message', (messageData) => {
      setConversations(prev => prev.map(conv => {
        if (conv.id === messageData.conversation_id) {
          return {
            ...conv,
            last_message: messageData,
            last_message_at: messageData.created_at
          }
        }
        return conv
      }))
    })
  }

  const loadConversations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await messagingService.getConversations()
      setConversations(response.conversations || [])
    } catch (err) {
      console.error('Error loading conversations:', err)
      setError(err.response?.data?.error || 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const handleConversationClick = (conversation) => {
    // Navigate to chat with customer
    if (conversation.customer_id) {
      navigate(`/chat/${conversation.id}`)
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="messages-container">
      {/* Top Bar */}
      <div className="messages-topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Header */}
      <div className="messages-header">
        <h1 className="messages-title">Messages</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="messages-error">
          {error}
          <button onClick={loadConversations}>Retry</button>
        </div>
      )}

      {/* Conversations List */}
      <div className="messages-list">
        {loading ? (
          <div className="loading">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <p>No conversations yet</p>
            <p className="empty-state-hint">You'll see customer messages here</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const customer = conversation.customer
            const lastMessage = conversation.last_message
            const unreadCount = conversation.unread_count || 0

            return (
              <div
                key={conversation.id}
                className={`conversation-item ${unreadCount > 0 ? 'unread' : ''}`}
                onClick={() => handleConversationClick(conversation)}
              >
                <div className="conversation-avatar">
                  {customer?.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="conversation-info">
                  <div className="conversation-header">
                    <h3 className="conversation-name">{customer?.name || 'Customer'}</h3>
                    {lastMessage && (
                      <span className="conversation-time">
                        {formatTime(lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="conversation-footer">
                    {lastMessage ? (
                      <p className="conversation-preview">
                        {lastMessage.content.length > 50
                          ? lastMessage.content.substring(0, 50) + '...'
                          : lastMessage.content}
                      </p>
                    ) : (
                      <p className="conversation-preview">No messages yet</p>
                    )}
                    {unreadCount > 0 && (
                      <span className="unread-badge">{unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Messages

