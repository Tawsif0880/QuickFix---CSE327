import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components'
import { Input, Button } from '../components'
import { providerService } from '../services/providerService'
import './Providers.css'

const Providers = () => {
  const navigate = useNavigate()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [location, setLocation] = useState('')
  const [minRating, setMinRating] = useState('')

  useEffect(() => {
    // Load all providers on mount
    loadAllProviders()
  }, [])

  const loadAllProviders = async () => {
    try {
      setLoading(true)
      // Call search with empty filters to get all providers
      const response = await providerService.searchProviders({})
      setProviders(response.providers || [])
    } catch (error) {
      console.error('Error loading providers:', error)
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      const filters = {}
      
      if (searchName.trim()) {
        filters.name = searchName.trim()
      }
      if (location.trim()) {
        filters.location = location.trim()
      }
      if (minRating) {
        filters.rating = parseFloat(minRating)
      }

      const response = await providerService.searchProviders(filters)
      setProviders(response.providers || [])
    } catch (error) {
      console.error('Error searching providers:', error)
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleFilterChange = () => {
    // Trigger search when filters change
    handleSearch()
  }

  const renderRating = (rating) => {
    if (!rating) return 'N/A'
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
      </div>
    )
  }

  return (
    <div className="providers-container">
      {/* Top Navigation */}
      <div className="providers-topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Search Section */}
      <div className="providers-search-section">
        <div className="search-bar">
          <Input
            type="text"
            placeholder="Search by name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyPress={handleKeyPress}
            name="searchName"
          />
        </div>

        {/* Filter Controls */}
        <div className="filters-container">
          <div className="filter-group">
            <Input
              type="text"
              placeholder="Location (city/area)"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                handleFilterChange()
              }}
              name="location"
            />
          </div>
          
          <div className="filter-group">
            <Input
              type="number"
              placeholder="Min Rating (1-5)"
              value={minRating}
              onChange={(e) => {
                const value = e.target.value
                if (value === '' || (parseFloat(value) >= 1 && parseFloat(value) <= 5)) {
                  setMinRating(value)
                  handleFilterChange()
                }
              }}
              min="1"
              max="5"
              step="0.1"
              name="minRating"
            />
          </div>
        </div>

        <Button
          onClick={handleSearch}
          variant="primary"
          fullWidth
          className="search-button"
        >
          Search
        </Button>
      </div>

      {/* Providers List */}
      <div className="providers-list">
        {loading ? (
          <div className="loading">Loading providers...</div>
        ) : providers.length === 0 ? (
          <div className="empty-state">No providers found</div>
        ) : (
          providers.map((provider) => (
            <div 
              key={provider.id} 
              className="provider-card"
            >
              <div className="provider-avatar">
                {provider.name ? provider.name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div className="provider-info">
                <h3 className="provider-name">{provider.name || 'Provider'}</h3>
                <p className="provider-category">{provider.category || 'Service Provider'}</p>
                {provider.description && (
                  <p className="provider-description">{provider.description.substring(0, 60)}...</p>
                )}
                {provider.hourly_rate && (
                  <p className="provider-rate">${provider.hourly_rate}/hour</p>
                )}
              </div>
              <div className="provider-rating-section">
                {renderRating(provider.rating_avg)}
              </div>
              <Button
                onClick={() => navigate(`/provider/${provider.id}`)}
                variant="secondary"
                className="view-profile-button"
              >
                View Profile
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Providers
