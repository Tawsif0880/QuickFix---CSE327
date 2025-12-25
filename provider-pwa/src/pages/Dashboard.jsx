import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components'
import { providerService } from '../services/providerService'
import { messagingService } from '../services/messagingService'
import { useAuth } from '../context/AuthContext'
import { io } from 'socket.io-client'
import './Dashboard.css'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  
  const handleSignOut = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    logout()
    navigate('/')
  }
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [isAvailable, setIsAvailable] = useState(true)
  const [loading, setLoading] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationJob, setNotificationJob] = useState(null)
  const socketRef = useRef(null)
  const notificationTimeoutRef = useRef(null)

  useEffect(() => {
    // Load emergency status from user profile
    if (user?.profile?.emergency_active !== undefined) {
      setEmergencyActive(user.profile.emergency_active)
    }
    
    // Load availability status from user profile
    if (user?.profile?.is_available !== undefined) {
      setIsAvailable(user.profile.is_available)
    } else {
      // Default to available (Free) on first login
      setIsAvailable(true)
    }
    
    // Load unread message count
    loadUnreadCount()
    
    // Setup socket for emergency notifications
    setupSocket()
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }
    }
  }, [user])

  const loadUnreadCount = async () => {
    try {
      const response = await messagingService.getUnreadCount()
      setUnreadCount(response.unread_count || 0)
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }

  const setupSocket = () => {
    const token = localStorage.getItem('token')
    if (!token || !user?.profile?.emergency_active) return

    socketRef.current = io(SOCKET_URL, {
      auth: { token }
    })

    // Join provider room for emergency updates
    socketRef.current.emit('join_provider_room', { token })

    // Listen for new emergency jobs
    socketRef.current.on('emergency_job_created', (jobData) => {
      // Only show notification if emergency is active
      if (user?.profile?.emergency_active && jobData.status === 'OPEN' && !jobData.provider_id) {
        // Show pop-up notification
        setNotificationJob(jobData)
        setShowNotification(true)
        
        // Auto-dismiss after 5 seconds
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current)
        }
        notificationTimeoutRef.current = setTimeout(() => {
          setShowNotification(false)
          setNotificationJob(null)
        }, 5000)
      }
    })

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })
  }

  const handleToggleEmergency = async (e) => {
    const newValue = e.target.checked
    setLoading(true)
    try {
      await providerService.toggleEmergency(newValue)
      setEmergencyActive(newValue)
      // Update user context if needed
    } catch (err) {
      console.error('Error toggling emergency:', err)
      // Revert on error
      e.target.checked = !newValue
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAvailability = async (e) => {
    const newValue = e.target.checked
    setAvailabilityLoading(true)
    try {
      await providerService.toggleAvailability(newValue)
      setIsAvailable(newValue)
      // Refresh user context to get updated profile
      if (updateUser) {
        try {
          await updateUser()
        } catch (updateErr) {
          console.error('Error updating user context:', updateErr)
        }
      }
    } catch (err) {
      console.error('Error toggling availability:', err)
      // Revert on error
      e.target.checked = !newValue
    } finally {
      setAvailabilityLoading(false)
    }
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <button className="icon-button" onClick={() => navigate('/settings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <button className="icon-button" onClick={() => navigate('/profile')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </button>
      </div>

      {/* Pop-up Notification */}
      {showNotification && notificationJob && (
        <div className="emergency-notification-popup" onClick={() => setShowNotification(false)}>
          <div className="emergency-notification-content" onClick={(e) => e.stopPropagation()}>
            <div className="emergency-notification-header">
              <span className="emergency-notification-badge">NEW EMERGENCY JOB</span>
              <button 
                className="emergency-notification-close"
                onClick={() => setShowNotification(false)}
              >
                ×
              </button>
            </div>
            <div className="emergency-notification-body">
              <h3 className="emergency-notification-title">{notificationJob.title}</h3>
              <p className="emergency-notification-category">{notificationJob.category}</p>
              <p className="emergency-notification-description">{notificationJob.description}</p>
              {notificationJob.offered_price && (
                <p className="emergency-notification-price">
                  Offered: ${parseFloat(notificationJob.offered_price).toFixed(2)}
                </p>
              )}
              <button
                className="emergency-notification-view-button"
                onClick={() => {
                  setShowNotification(false)
                  navigate('/emergency-requests')
                }}
              >
                View Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Availability Toggle and Messages Section */}
      <div className="availability-messages-section">
        {/* Availability Toggle */}
        <div className="availability-toggle-container">
          <label className="availability-toggle-label">
            <span className="availability-toggle-text">{isAvailable ? 'Free' : 'Busy'}</span>
            <input
              type="checkbox"
              className="availability-toggle-switch"
              checked={isAvailable}
              onChange={handleToggleAvailability}
              disabled={availabilityLoading}
            />
          </label>
        </div>

      {/* Messages Icon */}
      <div className="messages-section">
        <button className="messages-button" onClick={() => navigate('/messages')}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            <circle cx="12" cy="12" r="1" fill="currentColor"/>
            <circle cx="8" cy="12" r="1" fill="currentColor"/>
            <circle cx="16" cy="12" r="1" fill="currentColor"/>
          </svg>
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* First Row - Job Board and Appointed Job */}
        <div className="cards-row">
          <div className="dashboard-card job-board-card" onClick={() => navigate('/job-board')}>
            <h3 className="card-title">Job Board (NearBy Location)</h3>
          </div>

          <div className="dashboard-card appointed-card" onClick={() => navigate('/requested-jobs')}>
            <h3 className="card-title">Requested Jobs</h3>
          </div>
        </div>

        {/* Accepted Job Request Card */}
        <div className="dashboard-card accepted-card" onClick={() => navigate('/accepted-jobs')}>
          <h3 className="card-title">Accepted Job Request</h3>
        </div>

        {/* Emergency Service Activation Toggle */}
        <div className="emergency-toggle-section">
          <div className="emergency-toggle-container">
            <label className="emergency-toggle-label">
              <span>Emergency Service Activation</span>
              <input
                type="checkbox"
                className="emergency-toggle-switch"
                checked={emergencyActive}
                onChange={handleToggleEmergency}
                disabled={loading}
              />
            </label>
          </div>
        </div>

        {/* Emergency Buttons */}
        <div className="emergency-buttons-section">
          <button
            className="emergency-button emergency-requests-button"
            onClick={() => navigate('/emergency-requests')}
            disabled={!emergencyActive}
          >
            Emergency Requests
          </button>
          <button
            className="emergency-button emergency-jobs-button"
            onClick={() => navigate('/emergency-jobs')}
          >
            Emergency Jobs
          </button>
        </div>

        {/* Upcoming Calls Card */}
        <div className="dashboard-card payment-card" onClick={() => navigate('/upcoming-calls')}>
          <h3 className="card-title">Upcoming Calls</h3>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/job-history')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
          <span>Job History</span>
        </button>
        
        <button className="nav-item" onClick={() => navigate('/saved-jobs')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
          <span>Saved Jobs</span>
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

