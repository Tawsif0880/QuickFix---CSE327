import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components'
import { providerService } from '../services/providerService'
import './UpcomingCalls.css'

const UpcomingCalls = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [upcomingCalls, setUpcomingCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadUpcomingCalls()
  }, [])

  const loadUpcomingCalls = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await providerService.getUpcomingCalls()
      setUpcomingCalls(data.upcoming_calls || [])
    } catch (err) {
      console.error('Error loading upcoming calls:', err)
      setError(err.response?.data?.error || 'Failed to load upcoming calls')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="upcoming-calls-container">
        <div className="loading">Loading upcoming calls...</div>
      </div>
    )
  }

  return (
    <div className="upcoming-calls-container">
      {/* Top Bar */}
      <div className="upcoming-calls-topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Header */}
      <div className="upcoming-calls-header">
        <h1 className="upcoming-calls-title">Upcoming Calls</h1>
        <p className="upcoming-calls-subtitle">Customers who viewed your contact number</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="upcoming-calls-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Upcoming Calls List */}
      <div className="upcoming-calls-content">
        {upcomingCalls.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <p>No upcoming calls yet</p>
            <p className="empty-state-subtitle">When customers view your contact number, they will appear here.</p>
          </div>
        ) : (
          <div className="calls-list">
            {upcomingCalls.map((call) => (
              <div key={call.id} className="call-item">
                <div className="call-item-header">
                  <div className="call-customer-info">
                    <div className="call-customer-avatar">
                      {call.customer?.name ? call.customer.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div className="call-customer-details">
                      <h3 className="call-customer-name">
                        {call.customer?.name || 'Unknown Customer'}
                      </h3>
                      <p className="call-date">{formatDate(call.created_at)}</p>
                    </div>
                  </div>
                  <div className="call-credits-badge">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="credits-amount">+{call.credits_awarded}</span>
                    <span className="credits-label">credits</span>
                  </div>
                </div>
                <div className="call-item-footer">
                  <button
                    className="view-profile-button"
                    onClick={() => {
                      navigate(`/customer-profile/${call.customer_id}`)
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    View Customer Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/call-customer')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
          <span>Call Customer</span>
        </button>
        
        <button className="nav-item" onClick={() => navigate('/saved-jobs')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
          <span>Saved Jobs</span>
        </button>
        
        <button className="nav-item" onClick={() => navigate('/updates')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          <span>Updates</span>
        </button>
      </div>
    </div>
  )
}

export default UpcomingCalls

