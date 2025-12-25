import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button, Input } from '../components'
import { jobService } from '../services/jobService'
import './BookService.css'

const BookService = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    offered_price: '',
    location_address: '',
    latitude: '',
    longitude: '',
    preferred_date: ''
  })

  const categories = [
    'plumber',
    'electrician',
    'carpenter',
    'painter',
    'mechanic',
    'gardener',
    'cleaner',
    'handyman',
    'other'
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!formData.title || !formData.description || !formData.category) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    if (formData.offered_price && isNaN(parseFloat(formData.offered_price))) {
      setError('Please enter a valid price')
      setLoading(false)
      return
    }

    try {
      const requestData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        offered_price: formData.offered_price ? parseFloat(formData.offered_price) : null,
        location_address: formData.location_address || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        preferred_date: formData.preferred_date || null
      }

      const response = await jobService.createServiceRequest(requestData)
      
      // Navigate to confirmation page
      navigate('/request-accepted', {
        state: {
          booking: {
            id: response.request?.id,
            status: 'OPEN',
            price: response.request?.offered_price
          }
        }
      })
    } catch (err) {
      console.error('Error creating service request:', err)
      setError(err.response?.data?.error || 'Failed to create service request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="book-service-container">
      {/* Top Bar */}
      <div className="book-service-topbar">
        <button className="icon-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Form */}
      <div className="book-service-content">
        <h1 className="book-service-title">Book a Service</h1>
        <p className="book-service-subtitle">Fill in the details below to create a service request</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="book-service-form">
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="form-select"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <Input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Fix leaking faucet"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Job Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the service you need..."
              required
              rows="5"
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label htmlFor="offered_price">Offered Price ($)</label>
            <Input
              id="offered_price"
              name="offered_price"
              type="number"
              value={formData.offered_price}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location_address">Location Address</label>
            <Input
              id="location_address"
              name="location_address"
              type="text"
              value={formData.location_address}
              onChange={handleChange}
              placeholder="Enter service location"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="latitude">Latitude (optional)</label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="e.g., 40.7128"
                step="any"
              />
            </div>

            <div className="form-group">
              <label htmlFor="longitude">Longitude (optional)</label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="e.g., -74.0060"
                step="any"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="preferred_date">Preferred Date</label>
            <Input
              id="preferred_date"
              name="preferred_date"
              type="datetime-local"
              value={formData.preferred_date}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookService
