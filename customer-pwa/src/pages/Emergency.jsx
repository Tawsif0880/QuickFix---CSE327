import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button } from '../components'
import { emergencyService } from '../services/emergencyService'
import { userService } from '../services/userService'
import { useAuth } from '../context/AuthContext'
import './Emergency.css'

const Emergency = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    location_address: '',
    latitude: null,
    longitude: null,
    offered_price: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [customerCredits, setCustomerCredits] = useState(0)

  useEffect(() => {
    // Load customer credits
    loadCredits()
    
    // Auto-detect location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }))
          // Reverse geocode to get address (simplified - in production use a geocoding service)
          setLocationError('')
        },
        (err) => {
          console.error('Geolocation error:', err)
          setLocationError('Could not detect location. Please enter manually.')
        }
      )
    } else {
      setLocationError('Geolocation not supported. Please enter location manually.')
    }
  }, [])

  const loadCredits = async () => {
    try {
      const balance = await userService.getCreditBalance()
      setCustomerCredits(balance.credits || 0)
    } catch (error) {
      console.error('Error loading credit balance:', error)
      // Fallback to user profile credits
      if (user?.profile?.credits !== undefined) {
        setCustomerCredits(user.profile.credits)
      }
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  // Calculate emergency credit cost (5% of offered price)
  const calculateEmergencyCost = () => {
    if (!formData.offered_price || parseFloat(formData.offered_price) <= 0) {
      return 0
    }
    return parseFloat(formData.offered_price) * 0.05
  }

  const emergencyCost = calculateEmergencyCost()
  const hasEnoughCredits = customerCredits >= emergencyCost

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.category) {
      setError('Category is required')
      return
    }
    if (!formData.description) {
      setError('Description is required')
      return
    }
    if (!formData.offered_price || parseFloat(formData.offered_price) <= 0) {
      setError('Valid offered price is required')
      return
    }

    try {
      setLoading(true)
      const response = await emergencyService.createEmergencyJob({
        category: formData.category,
        description: formData.description,
        location_address: formData.location_address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        offered_price: parseFloat(formData.offered_price)
      })

      alert('Emergency service request submitted successfully!')
      navigate('/dashboard')
    } catch (err) {
      console.error('Error creating emergency job:', err)
      setError(err.response?.data?.error || 'Failed to submit emergency request')
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    'plumber',
    'electrician',
    'carpenter',
    'painter',
    'mechanic',
    'technician',
    'other'
  ]

  return (
    <div className="emergency-container">
      {/* Top Bar */}
      <div className="emergency-topbar">
        <button className="icon-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Content */}
      <div className="emergency-content">
        <div className="emergency-header">
          <h1 className="emergency-title">Emergency Service</h1>
          <p className="emergency-subtitle">Submit an urgent service request</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="emergency-form">
          {/* Category */}
          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category <span className="required">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Job Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              rows="4"
              placeholder="Describe the emergency situation..."
              required
            />
          </div>

          {/* Location */}
          <div className="form-group">
            <label htmlFor="location_address" className="form-label">
              Location <span className="required">*</span>
            </label>
            <input
              type="text"
              id="location_address"
              name="location_address"
              value={formData.location_address}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your location address"
              required
            />
            {locationError && (
              <p className="location-hint">{locationError}</p>
            )}
            {(formData.latitude && formData.longitude) && (
              <p className="location-hint success">
                Location detected: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
              </p>
            )}
          </div>

          {/* Offered Price */}
          <div className="form-group">
            <label htmlFor="offered_price" className="form-label">
              Offered Price ($) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="offered_price"
              name="offered_price"
              value={formData.offered_price}
              onChange={handleChange}
              className="form-input"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
            {formData.offered_price && parseFloat(formData.offered_price) > 0 && (
              <div className="emergency-credit-warning">
                <span className="warning-icon">⚠️</span>
                <span className="warning-text">
                  Emergency service will deduct {emergencyCost.toFixed(2)} credits from your balance when a provider accepts
                </span>
              </div>
            )}
            {formData.offered_price && parseFloat(formData.offered_price) > 0 && !hasEnoughCredits && (
              <div className="emergency-credit-error">
                Insufficient credits. Required: {emergencyCost.toFixed(2)}, Available: {customerCredits.toFixed(2)}
              </div>
            )}
          </div>

          {/* Current Credits Display */}
          <div className="current-credits-display">
            <span className="credits-label">Current Balance:</span>
            <span className="credits-amount">{customerCredits.toFixed(2)} credits</span>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="emergency-submit-button"
            disabled={loading || (formData.offered_price && !hasEnoughCredits)}
            title={formData.offered_price && !hasEnoughCredits ? 'Insufficient credits' : ''}
          >
            {loading ? 'Submitting...' : 'Submit Emergency Request'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default Emergency
