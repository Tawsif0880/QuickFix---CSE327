import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo, Button } from '../components'
import { notificationService } from '../services/notificationService'
import { useNotificationCount } from '../hooks/useNotificationCount'
import './Notifications.css'

const Notifications = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refreshCount } = useNotificationCount()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [markingRead, setMarkingRead] = useState(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await notificationService.getNotifications()
      setNotifications(response.notifications || [])
      setUnreadCount(response.unread_count || 0)
    } catch (err) {
      console.error('Error loading notifications:', err)
      setError(err.response?.data?.error || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      setMarkingRead(notificationId)
      await notificationService.markAsRead(notificationId)
      // Update local state
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
      // Refresh count in hook
      refreshCount()
    } catch (err) {
      console.error('Error marking notification as read:', err)
      setError(err.response?.data?.error || 'Failed to mark notification as read')
    } finally {
      setMarkingRead(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true)
      await notificationService.markAllAsRead()
      // Update local state
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })))
      setUnreadCount(0)
      // Refresh count in hook
      refreshCount()
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      setError(err.response?.data?.error || 'Failed to mark all notifications as read')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      handleMarkAsRead(notification.id)
    }

    // Navigate based on notification type
    if (notification.type === 'job_accepted' && notification.data?.job_id) {
      // Navigate to orders or job details
      navigate('/orders')
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_accepted':
        return '✓'
      case 'new_offer':
        return '💼'
      case 'new_message':
        return '💬'
      case 'booking_status':
        return '📅'
      default:
        return '🔔'
    }
  }

  return (
    <div className="notifications-container">
      {/* Top Bar */}
      <div className="notifications-topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Header */}
      <div className="notifications-header">
        <div className="notifications-header-content">
          <h1 className="notifications-title">Notifications</h1>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              onClick={handleMarkAllAsRead}
              disabled={loading}
              className="mark-all-read-button"
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="notifications-error">
          {error}
          <button onClick={loadNotifications}>Retry</button>
        </div>
      )}

      {/* Notifications List */}
      <div className="notifications-list">
        {loading ? (
          <div className="loading">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <p>No notifications yet</p>
            <p className="empty-state-hint">You'll see notifications here when providers accept your job requests!</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const isUnread = !notification.is_read

            return (
              <div
                key={notification.id}
                className={`notification-item ${isUnread ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-info">
                  <div className="notification-header">
                    <h3 className="notification-message">{notification.message}</h3>
                    <span className="notification-time">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                  {isUnread && (
                    <div className="notification-actions">
                      <button
                        className="mark-read-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                        disabled={markingRead === notification.id}
                      >
                        {markingRead === notification.id ? 'Marking...' : 'Mark as read'}
                      </button>
                    </div>
                  )}
                </div>
                {isUnread && <div className="unread-indicator"></div>}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Notifications

