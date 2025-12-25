import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button } from '../components'
import { useAuth } from '../context/AuthContext'
import { messagingService } from '../services/messagingService'
import { useNotificationCount } from '../hooks/useNotificationCount'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [messageUnreadCount, setMessageUnreadCount] = useState(0)
  const { unreadCount: notificationUnreadCount } = useNotificationCount()
  
  useEffect(() => {
    loadUnreadCount()
  }, [])
  
  const loadUnreadCount = async () => {
    try {
      const response = await messagingService.getUnreadCount()
      setMessageUnreadCount(response.unread_count || 0)
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }
  
  const handleSignOut = () => {
    logout()
    navigate('/')
  }
  
  // Get display name from user profile or auth user
  const displayName = user?.profile?.name || user?.name || 'User'

  return (
    <div className="dashboard-container">
      {/* Top Bar */}
      <div className="dashboard-topbar">
        <button className="icon-button" onClick={() => navigate('/settings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <button className="icon-button" onClick={() => navigate('/search')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
      </div>

      {/* User Profile Section */}
      <div className="dashboard-profile-name">
        <button 
          className="profile-name-button"
          onClick={() => navigate('/profile')}
        >
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="profile-avatar-ring"></div>
          </div>
          <div className="profile-info">
            <span className="profile-greeting">Welcome back,</span>
            <span className="profile-name-text">{displayName}</span>
          </div>
          <div className="profile-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </button>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Service Provider Section */}
        <div className="dashboard-section" onClick={() => navigate('/providers')}>
          <div className="section-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <p className="section-text">Find Our Top<br/>Service Provider</p>
        </div>

        {/* Messages Section */}
        <div className="dashboard-section" onClick={() => navigate('/messages')}>
          <div className="section-icon messages-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              <circle cx="12" cy="12" r="1" fill="currentColor"/>
              <circle cx="8" cy="12" r="1" fill="currentColor"/>
              <circle cx="16" cy="12" r="1" fill="currentColor"/>
            </svg>
            {messageUnreadCount > 0 && (
              <span className="notification-badge">{messageUnreadCount > 99 ? '99+' : messageUnreadCount}</span>
            )}
          </div>
          <p className="section-text">Messages</p>
        </div>

        {/* Action Buttons */}
        <div className="dashboard-actions">
          <Button 
            variant="secondary"
            onClick={() => navigate('/chat-expert')}
            className="action-button"
          >
            <span>Talk With An Expert</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </Button>

          <Button 
            variant="secondary"
            onClick={() => navigate('/chat-ai')}
            className="action-button"
          >
            <span>Chat With AI Assistant</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
            </svg>
          </Button>

          <Button 
            variant="secondary"
            onClick={() => navigate('/call-expert')}
            className="action-button"
          >
            <span>Call An Expert</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          </Button>

          <Button 
            variant="secondary"
            onClick={() => navigate('/book-service')}
            className="action-button"
          >
            <span>Book For Service</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
            </svg>
          </Button>

          <Button 
            variant="secondary"
            onClick={() => navigate('/emergency')}
            className="action-button emergency-button"
          >
            <span>Emergency Service</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </Button>
        </div>

        {/* Floating ChatBot Widget is already available globally */}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/location')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span>Location</span>
        </button>
        
        <button className="nav-item nav-item-notification" onClick={() => navigate('/notifications')}>
          <div style={{ position: 'relative' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
            {notificationUnreadCount > 0 && (
              <span className="nav-notification-badge">{notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}</span>
            )}
          </div>
          <span>Notification</span>
        </button>
        
        <button className="nav-item" onClick={() => navigate('/orders')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <span>Orders</span>
        </button>
        
        <button className="nav-item signout-nav" onClick={handleSignOut}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

export default Dashboard

