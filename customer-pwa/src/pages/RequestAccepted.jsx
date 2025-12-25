import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Logo, Button } from '../components'
import './RequestAccepted.css'

const RequestAccepted = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const booking = location.state?.booking || {}

  return (
    <div className="request-accepted-container">
      <div className="request-accepted-content">
        <div className="success-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        
        <h1 className="success-title">Request Accepted!</h1>
        
        <p className="success-message">
          Your service request has been accepted. The provider will contact you shortly.
        </p>
        
        {booking.id && (
          <div className="booking-details">
            <div className="detail-item">
              <span className="detail-label">Booking ID:</span>
              <span className="detail-value">#{booking.id}</span>
            </div>
            {booking.price && (
              <div className="detail-item">
                <span className="detail-label">Price:</span>
                <span className="detail-value">${booking.price.toFixed(2)}</span>
              </div>
            )}
            {booking.status && (
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value status-badge">{booking.status}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="action-buttons">
          <Button 
            variant="primary"
            onClick={() => navigate('/orders')}
            fullWidth
          >
            View My Orders
          </Button>
          
          <Button 
            variant="secondary"
            onClick={() => navigate('/dashboard')}
            fullWidth
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RequestAccepted

