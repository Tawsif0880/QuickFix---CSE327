import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Logo } from '../components'
import { providerService } from '../services/providerService'
import './ChatExpert.css'

const ChatExpert = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Get category from URL search params if available
  const getCategoryFromUrl = () => {
    const params = new URLSearchParams(location.search)
    return params.get('category') || ''
  }
  
  const [selectedCategory, setSelectedCategory] = useState(getCategoryFromUrl())
  const [categories] = useState([
    { value: 'plumber', label: 'Plumber' },
    { value: 'electrician', label: 'Electrician' },
    { value: 'carpenter', label: 'Carpenter' },
    { value: 'painter', label: 'Painter' },
    { value: 'mechanic', label: 'Mechanic' },
    { value: 'handyman', label: 'Handyman' },
    { value: 'cleaner', label: 'Cleaner' },
    { value: 'gardener', label: 'Gardener' }
  ])

  useEffect(() => {
    if (selectedCategory) {
      loadProviders()
    } else {
      setLoading(false)
      setProviders([])
    }
  }, [selectedCategory])

  const loadProviders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const searchFilters = {
        category: selectedCategory
      }
      
      const response = await providerService.searchProviders(searchFilters)
      
      if (response && response.providers) {
        setProviders(response.providers)
      } else {
        setProviders([])
        setError('No providers found in this category.')
      }
    } catch (error) {
      console.error('Error loading providers:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load providers. Please try again.'
      setError(errorMessage)
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  const handleProviderSelect = (providerId) => {
    navigate(`/chat/${providerId}`)
  }

  return (
    <div className="chat-expert-container">
      {/* Top Bar */}
      <div className="chat-expert-topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Header */}
      <div className="chat-expert-header">
        <h1 className="chat-expert-title">Talk with Expert</h1>
        <p className="chat-expert-subtitle">Select a category to find an expert</p>
      </div>

      {/* Category Selection */}
      <div className="category-selection">
        <h2 className="category-title">Select Profession</h2>
        <div className="category-dropdown-wrapper">
          <select
            className="category-dropdown"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">-- Select a profession --</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Providers List */}
      {selectedCategory && (
        <div className="providers-section">
          <h2 className="providers-title">Available Experts</h2>
          
          {loading ? (
            <div className="loading">Loading experts...</div>
          ) : error && providers.length === 0 ? (
            <div className="empty-state">
              <p>{error}</p>
            </div>
          ) : providers.length === 0 ? (
            <div className="empty-state">
              <p>No experts found in this category</p>
            </div>
          ) : (
            <div className="providers-list">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="provider-card"
                  onClick={() => handleProviderSelect(provider.id)}
                >
                  <div className="provider-avatar">
                    {provider.name ? provider.name.charAt(0).toUpperCase() : 'E'}
                  </div>
                  <div className="provider-info">
                    <h3 className="provider-name">{provider.name || 'Expert'}</h3>
                    <p className="provider-category">{provider.category || 'Service Provider'}</p>
                    {provider.rating_avg !== null && provider.rating_avg !== undefined && (
                      <div className="provider-rating">
                        <span className="rating-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`star ${star <= Math.round(provider.rating_avg) ? 'filled' : ''}`}
                            >
                              ★
                            </span>
                          ))}
                        </span>
                        <span className="rating-value">
                          {provider.rating_avg.toFixed(1)} {provider.rating_avg === 0 ? '(N/A)' : ''}
                        </span>
                      </div>
                    )}
                    {!provider.rating_avg && (
                      <div className="provider-rating">
                        <span className="rating-value">Rating: N/A</span>
                      </div>
                    )}
                    {provider.credits_per_text !== undefined && (
                      <div className="provider-credits">
                        <span className="credits-label">Credits per text:</span>
                        <span className="credits-value">{provider.credits_per_text}</span>
                      </div>
                    )}
                  </div>
                  <div className="provider-arrow">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ChatExpert

