import { useState, useEffect, useRef } from 'react'
import { notificationService } from '../services/notificationService'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

export const useNotificationCount = () => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const socketRef = useRef(null)

  useEffect(() => {
    loadUnreadCount()
    setupSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const loadUnreadCount = async () => {
    try {
      setLoading(true)
      const response = await notificationService.getUnreadCount()
      setUnreadCount(response.unread_count || 0)
    } catch (err) {
      console.error('Error loading notification count:', err)
    } finally {
      setLoading(false)
    }
  }

  const setupSocket = () => {
    const token = localStorage.getItem('token')
    if (!token) return

    socketRef.current = io(SOCKET_URL, {
      auth: { token }
    })

    // Join user room for notification updates
    socketRef.current.emit('join_user_room', { token })

    // Listen for new notifications
    socketRef.current.on('new_notification', (data) => {
      // Increment count when new notification arrives
      setUnreadCount(prev => prev + 1)
    })

    // Listen for notification read updates
    socketRef.current.on('notification_read', (data) => {
      // Reload count when notification is marked as read
      loadUnreadCount()
    })

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })
  }

  return { unreadCount, loading, refreshCount: loadUnreadCount }
}

