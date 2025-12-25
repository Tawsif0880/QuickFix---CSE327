import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button } from '../components'
import { emergencyService } from '../services/emergencyService'
import { useAuth } from '../context/AuthContext'
import { io } from 'socket.io-client'
import './EmergencyRequests.css'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

const EmergencyRequests = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acceptingJobId, setAcceptingJobId] = useState(null)
  const [providerCredits, setProviderCredits] = useState(0)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationJob, setNotificationJob] = useState(null)
  const socketRef = useRef(null)
  const notificationTimeoutRef = useRef(null)

  useEffect(() => {
    loadRequests()
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

  const setupSocket = () => {
    const token = localStorage.getItem('token')
    if (!token) return

    socketRef.current = io(SOCKET_URL, {
      auth: { token }
    })

    // Join provider room for emergency updates
    socketRef.current.emit('join_provider_room', { token })

    // Listen for new emergency jobs
    socketRef.current.on('emergency_job_created', (jobData) => {
      // Only process if provider has emergency_active enabled (backend already filters, but double-check)
      const isEmergencyActive = user?.profile?.emergency_active === true
      
      // Only add if it matches provider's category and isn't already accepted
      if (isEmergencyActive && jobData.status === 'OPEN' && !jobData.provider_id) {
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
        
        setRequests(prev => {
          // Avoid duplicates
          if (prev.some(r => r.id === jobData.id)) {
            return prev
          }
          return [jobData, ...prev]
        })
      }
    })

    // Listen for accepted emergency jobs (remove from list)
    socketRef.current.on('emergency_job_accepted', (data) => {
      setRequests(prev => prev.filter(req => req.id !== data.job_id))
    })

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })
  }

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await emergencyService.getEmergencyRequests()
      setRequests(response.requests || [])
      
      // Get provider credits from user profile
      if (user?.profile?.credits !== undefined) {
        setProviderCredits(user.profile.credits)
      }
    } catch (err) {
      console.error('Error loading emergency requests:', err)
      setError(err.response?.data?.error || 'Failed to load emergency requests')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (jobId) => {
    try {
      setAcceptingJobId(jobId)
      setError('')
      const response = await emergencyService.acceptEmergencyJob(jobId)
      
      // Remove accepted job from list
      setRequests(prev => prev.filter(req => req.id !== jobId))
      
      // Update credits if returned
      if (response.provider_remaining_credits !== undefined) {
        setProviderCredits(response.provider_remaining_credits)
      }
      
      alert('Emergency job accepted successfully!')
      
      // Reload to get updated list
      loadRequests()
    } catch (err) {
      console.error('Error accepting emergency job:', err)
      const errorMsg = err.response?.data?.error || 'Failed to accept emergency job'
      const errorData = err.response?.data
      
      if (err.response?.status === 400 && (
        errorMsg === 'INSUFFICIENT_CREDITS' || 
        errorData?.error === 'INSUFFICIENT_CREDITS' ||
        errorMsg === 'CUSTOMER_INSUFFICIENT_CREDITS' ||
        errorData?.error === 'CUSTOMER_INSUFFICIENT_CREDITS'
      )) {
        setError(errorData?.message || 'Customer has insufficient credits. This job cannot be accepted.')
        loadRequests()
      } else {
        setError(errorMsg)
        if (err.response?.status === 409 || errorMsg.includes('already been accepted')) {
          loadRequests()
        }
      }
    } finally {
      setAcceptingJobId(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="emergency-requests-container">
      {/* Top Bar */}
      <div className="emergency-requests-topbar">
        <button className="icon-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <button className="icon-button" onClick={loadRequests}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
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
                  // Scroll to the job in the list if it exists
                  const jobElement = document.querySelector(`[data-job-id="${notificationJob.id}"]`)
                  if (jobElement) {
                    jobElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    // Highlight the job briefly
                    jobElement.style.backgroundColor = '#fff3cd'
                    setTimeout(() => {
                      jobElement.style.backgroundColor = ''
                    }, 2000)
                  }
                }}
              >
                View Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="emergency-requests-content">
        <h1 className="emergency-requests-title">Emergency Requests</h1>
        <p className="emergency-requests-subtitle">Urgent service requests in your category</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <p>Loading emergency requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <p>No emergency requests available at the moment</p>
          </div>
        ) : (
          <div className="emergency-requests-list">
            {requests.map(request => {
              // Emergency jobs: Provider earns 5% when accepting (customer pays)
              const earningPotential = request.offered_price ? (request.offered_price * 0.05) : 0
              const canAccept = request.status === 'OPEN' && !request.provider_id
              const isAccepting = acceptingJobId === request.id

              return (
                <div key={request.id} className="emergency-request-card" data-job-id={request.id}>
                  <div className="emergency-request-header">
                    <div className="emergency-badge">EMERGENCY</div>
                    <div className="request-category">{request.category}</div>
                  </div>

                  <h3 className="request-title">{request.title}</h3>
                  <p className="request-description">{request.description}</p>

                  <div className="request-details">
                    {request.customer && (
                      <div className="request-detail-item">
                        <span className="detail-label">Customer:</span>
                        <span className="detail-value">{request.customer.name || 'N/A'}</span>
                      </div>
                    )}

                    {request.location_address && (
                      <div className="request-detail-item">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value">{request.location_address}</span>
                      </div>
                    )}

                    {request.offered_price && (
                      <div className="request-detail-item">
                        <span className="detail-label">Offered Price:</span>
                        <span className="detail-value">${parseFloat(request.offered_price).toFixed(2)}</span>
                      </div>
                    )}

                    {request.offered_price && (
                      <div className="request-detail-item">
                        <span className="detail-label">Earning Potential:</span>
                        <span className="detail-value">{earningPotential.toFixed(2)} credits (5% of price)</span>
                      </div>
                    )}

                    {request.created_at && (
                      <div className="request-detail-item">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">{formatDate(request.created_at)}</span>
                      </div>
                    )}
                  </div>

                  <div className="request-actions">
                    <Button
                      variant="primary"
                      onClick={() => handleAccept(request.id)}
                      disabled={!canAccept || isAccepting}
                      className="accept-emergency-button"
                    >
                      {isAccepting ? 'Accepting...' : 'Accept Now'}
                    </Button>
                  </div>

                  {!canAccept && request.status === 'OPEN' && (
                    <div className="request-status-note">
                      This request is no longer available
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmergencyRequests
