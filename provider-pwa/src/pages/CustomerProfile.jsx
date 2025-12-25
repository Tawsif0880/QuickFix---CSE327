import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components'
import { providerService } from '../services/providerService'
import './CustomerProfile.css'

const CustomerProfile = () => {
  const navigate = useNavigate()
  const { customerId } = useParams()
  const { user } = useAuth()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (customerId) {
      loadCustomerProfile()
    }
  }, [customerId])

  const loadCustomerProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await providerService.getCustomerProfile(customerId)
      if (data.customer) {
        setCustomer(data.customer)
      } else {
        setError('Customer profile not found')
      }
    } catch (err) {
      console.error('Error loading customer profile:', err)
      setError(err.response?.data?.error || 'Failed to load customer profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="customer-profile-container">
        <div className="loading">Loading customer profile...</div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="customer-profile-container">
        <div className="error-message">{error || 'Customer profile not found'}</div>
        <button className="back-button" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="customer-profile-container">
      {/* Top Bar */}
      <div className="customer-profile-topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Profile Header */}
      <div className="customer-profile-header">
        <div className="customer-profile-avatar">
          {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
        </div>
        <h1 className="customer-profile-name">{customer.name || 'Customer'}</h1>
        <p className="customer-profile-subtitle">Customer Profile (Read-Only)</p>
      </div>

      {/* Profile Information */}
      <div className="customer-profile-content">
        <div className="customer-profile-section">
          <h2 className="section-title">Contact Information</h2>
          
          {customer.phone && (
            <div className="info-item">
              <div className="info-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>Phone</span>
              </div>
              <div className="info-value">{customer.phone}</div>
            </div>
          )}

          {customer.address && (
            <div className="info-item">
              <div className="info-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>Address</span>
              </div>
              <div className="info-value">{customer.address}</div>
            </div>
          )}
        </div>

        <div className="customer-profile-section">
          <h2 className="section-title">Account Information</h2>
          
          {customer.rating_avg !== undefined && customer.rating_avg !== null && (
            <div className="info-item">
              <div className="info-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span>Rating</span>
              </div>
              <div className="info-value">
                <span className="rating-value">{customer.rating_avg.toFixed(1)}</span>
                <span className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= Math.round(customer.rating_avg) ? 'filled' : ''}`}
                    >
                      ★
                    </span>
                  ))}
                </span>
              </div>
            </div>
          )}

          {customer.created_at && (
            <div className="info-item">
              <div className="info-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Member Since</span>
              </div>
              <div className="info-value">
                {new Date(customer.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          )}
        </div>
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

export default CustomerProfile

