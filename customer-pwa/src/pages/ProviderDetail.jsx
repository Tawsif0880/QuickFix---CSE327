import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Logo } from '../components'
import { Button } from '../components'
import { providerService } from '../services/providerService'
import { userService } from '../services/userService'
import { jobService } from '../services/jobService'
import { useAuth } from '../context/AuthContext'
import './ProviderDetail.css'

const ProviderDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, updateUser } = useAuth()
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [credits, setCredits] = useState(user?.profile?.credits || 35)
  const [creditsNeeded, setCreditsNeeded] = useState(0)
  const [revealedPhone, setRevealedPhone] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    offered_price: '',
    location_address: '',
    preferred_date: ''
  })

  useEffect(() => {
    loadProviderDetails()
    loadCreditBalance()
  }, [id])

  useEffect(() => {
    // Pre-fill category from provider when provider loads
    if (provider && !formData.category) {
      setFormData(prev => ({ ...prev, category: provider.category || '' }))
    }
  }, [provider])

  useEffect(() => {
    // Calculate credits needed based on provider rating
    if (provider) {
      const rating = provider.rating_avg
      // Handle null, undefined, or 0.0 as NA (20 credits)
      if (rating === null || rating === undefined || rating === 0.0) {
        setCreditsNeeded(20) // NA
      } else if (rating >= 4.5) {
        setCreditsNeeded(20)
      } else if (rating >= 4.0) {
        setCreditsNeeded(15)
      } else if (rating >= 3.0) {
        setCreditsNeeded(9)
      } else {
        setCreditsNeeded(5)
      }
    }
  }, [provider])

  const loadProviderDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await providerService.getProviderDetails(id)
      setProvider(data)
    } catch (err) {
      console.error('Error loading provider details:', err)
      setError('Failed to load provider details')
    } finally {
      setLoading(false)
    }
  }

  const loadCreditBalance = async () => {
    try {
      const balance = await userService.getCreditBalance()
      setCredits(balance.credits)
    } catch (error) {
      console.error('Error loading credit balance:', error)
    }
  }

  const handleMessage = () => {
    // Placeholder - functionality coming soon
    alert('Message functionality coming soon')
  }

  const handleCall = () => {
    // Check if customer has enough credits
    if (credits < creditsNeeded) {
      alert(`Insufficient credits. You need ${creditsNeeded} credits to reveal contact. You have ${credits} credits.`)
      return
    }
    
    // Show confirmation dialog
    setShowConfirmDialog(true)
  }

  const handleConfirmCall = async () => {
    setShowConfirmDialog(false)
    setRevealing(true)
    
    try {
      const response = await providerService.revealContact(id)
      
      if (response.success && response.phone) {
        setRevealedPhone(response.phone)
        setCredits(response.remaining_credits)
        // Update user context
        await updateUser()
      }
    } catch (err) {
      if (err.response?.status === 402) {
        // Insufficient credits
        const errorData = err.response.data
        alert(errorData.message || 'Insufficient credits')
        setCredits(errorData.available || credits)
        await loadCreditBalance()
        await updateUser()
      } else {
        alert(err.response?.data?.error || 'Failed to reveal contact')
      }
    } finally {
      setRevealing(false)
    }
  }

  const handleCancelCall = () => {
    setShowConfirmDialog(false)
  }

  const handleRequestService = () => {
    setShowRequestForm(true)
  }

  const handleCloseRequestForm = () => {
    setShowRequestForm(false)
    setFormData({
      title: '',
      category: provider?.category || '',
      description: '',
      offered_price: '',
      location_address: '',
      preferred_date: ''
    })
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitRequest = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.title.trim()) {
      alert('Job title is required')
      return
    }
    if (!formData.description.trim()) {
      alert('Job description is required')
      return
    }
    if (!formData.offered_price || parseFloat(formData.offered_price) <= 0) {
      alert('Offered price is required and must be greater than 0')
      return
    }
    if (!formData.location_address.trim()) {
      alert('Location is required')
      return
    }

    setSubmitting(true)
    try {
      const requestData = {
        provider_id: parseInt(id),
        title: formData.title.trim(),
        category: formData.category || provider?.category || '',
        description: formData.description,
        offered_price: parseFloat(formData.offered_price),
        location_address: formData.location_address,
        preferred_date: formData.preferred_date || null
      }

      const response = await jobService.createProviderRequest(requestData)
      
      if (response.message) {
        alert('Service request submitted successfully!')
        handleCloseRequestForm()
        // Optionally navigate to orders page
        // navigate('/orders')
      }
    } catch (err) {
      console.error('Error submitting request:', err)
      alert(err.response?.data?.error || 'Failed to submit service request')
    } finally {
      setSubmitting(false)
    }
  }

  const renderRating = (rating) => {
    if (!rating) return null
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    return (
      <div className="rating-display">
        <div className="rating-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${star <= fullStars ? 'filled' : ''} ${star === fullStars + 1 && hasHalfStar ? 'half' : ''}`}
            >
              ★
            </span>
          ))}
        </div>
        <span className="rating-value">{rating.toFixed(1)}</span>
        {provider?.rating_stats?.total && (
          <span className="rating-count">({provider.rating_stats.total} reviews)</span>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="provider-detail-container">
        <div className="loading">Loading provider details...</div>
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="provider-detail-container">
        <div className="error-state">
          {error || 'Provider not found'}
          <Button onClick={() => navigate(-1)} variant="primary" className="mt-2">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="provider-detail-container">
      {/* Top Navigation */}
      <div className="provider-detail-topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Provider Header */}
      <div className="provider-detail-header">
        <div className="provider-detail-avatar">
          {provider.name ? provider.name.charAt(0).toUpperCase() : 'P'}
        </div>
        <h1 className="provider-detail-name">{provider.name || 'Provider'}</h1>
        {renderRating(provider.rating_avg)}
        {provider.verified && (
          <div className="verified-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Verified Provider</span>
          </div>
        )}
      </div>

      {/* Provider Information */}
      <div className="provider-detail-content">
        {/* Category */}
        {provider.category && (
          <div className="info-section">
            <h3 className="section-title">Category</h3>
            <p className="section-value">{provider.category}</p>
          </div>
        )}

        {/* Service Area */}
        {provider.service_area && (
          <div className="info-section">
            <h3 className="section-title">Preferred Area of Service</h3>
            <p className="section-value">{provider.service_area}</p>
          </div>
        )}

        {/* Description */}
        {provider.description && (
          <div className="info-section">
            <h3 className="section-title">About</h3>
            <p className="section-value">{provider.description}</p>
          </div>
        )}

        {/* Hourly Rate */}
        {provider.hourly_rate && (
          <div className="info-section">
            <h3 className="section-title">Hourly Rate</h3>
            <p className="section-value rate-value">${provider.hourly_rate}/hour</p>
          </div>
        )}

        {/* Revealed Contact */}
        {revealedPhone && (
          <div className="info-section">
            <h3 className="section-title">Contact Number</h3>
            <p className="section-value">
              <a href={`tel:${revealedPhone}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                {revealedPhone}
              </a>
            </p>
          </div>
        )}

        {/* Reviews Section */}
        {provider.reviews && provider.reviews.length > 0 && (
          <div className="info-section">
            <h3 className="section-title">Reviews</h3>
            <div className="reviews-list">
              {provider.reviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <div className="review-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star ${star <= review.rating ? 'filled' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {review.customer_name && (
                      <span className="review-author">{review.customer_name}</span>
                    )}
                    {review.created_at && (
                      <span className="review-date">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {review.review_text && (
                    <p className="review-text">{review.review_text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="provider-detail-actions">
        <Button
          onClick={handleMessage}
          variant="primary"
          fullWidth
          className="action-button"
        >
          Message
        </Button>
        <Button
          onClick={handleCall}
          variant="secondary"
          fullWidth
          className="action-button"
          disabled={!provider.phone || revealing || (credits < creditsNeeded && !revealedPhone)}
        >
          {revealing ? 'Revealing...' : revealedPhone ? 'Contact Revealed' : `Call an Expert (${creditsNeeded} credits)`}
        </Button>
        {credits < creditsNeeded && !revealedPhone && (
          <div style={{ 
            padding: '8px', 
            fontSize: '12px', 
            color: '#dc3545', 
            textAlign: 'center',
            marginTop: '-8px',
            marginBottom: '8px'
          }}>
            Insufficient credits. You need {creditsNeeded} credits.
          </div>
        )}
        <Button
          onClick={handleRequestService}
          variant="secondary"
          fullWidth
          className="action-button"
        >
          Request Service
        </Button>
      </div>

      {/* Request Service Form Dialog */}
      {showRequestForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Request Service</h3>
            <form onSubmit={handleSubmitRequest}>
              {/* Job Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Job Title <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter a title for this service request"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Job Category */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Job Category (Optional)
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  placeholder={provider?.category || 'Category'}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Job Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Job Description <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  required
                  rows="4"
                  placeholder="Describe the service you need..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Offered Price */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Offered Price <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="number"
                  name="offered_price"
                  value={formData.offered_price}
                  onChange={handleFormChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Location */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Location <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  name="location_address"
                  value={formData.location_address}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter service location address"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Preferred Date */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Preferred Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  name="preferred_date"
                  value={formData.preferred_date}
                  onChange={handleFormChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  onClick={handleCloseRequestForm}
                  variant="secondary"
                  style={{ minWidth: '100px' }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  style={{ minWidth: '100px' }}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Confirm Contact Reveal</h3>
            <p style={{ marginBottom: '16px' }}>
              This will deduct <strong>{creditsNeeded} credits</strong> from your account.
            </p>
            <p style={{ marginBottom: '24px', fontSize: '14px', color: '#666' }}>
              Your remaining credits: <strong>{credits}</strong>
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCancelCall}
                variant="secondary"
                style={{ minWidth: '100px' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmCall}
                variant="primary"
                style={{ minWidth: '100px' }}
                disabled={revealing}
              >
                {revealing ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProviderDetail

