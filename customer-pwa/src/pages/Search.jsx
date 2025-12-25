import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components'
import { Input, Button } from '../components'
import { providerService } from '../services/providerService'
import { useNotificationCount } from '../hooks/useNotificationCount'
import './Search.css'

const Search = () => {
  const navigate = useNavigate()
  const { unreadCount: notificationUnreadCount } = useNotificationCount()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    sortBy: '',
    minRating: '',
    maxPrice: '',
    location: '',
    useLocation: false
  })
  const [userLocation, setUserLocation] = useState(null)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    loadCategories()
    getLocation()
  }, [])

  useEffect(() => {
    // Load providers when filters, search query, or page changes
    loadProviders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters, searchQuery])

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const loadCategories = async () => {
    // Categories can be hardcoded or fetched from API if available
    // For now, using common service categories
    setCategories([
      { value: 'plumber', label: 'Plumber' },
      { value: 'electrician', label: 'Electrician' },
      { value: 'carpenter', label: 'Carpenter' },
      { value: 'painter', label: 'Painter' },
      { value: 'mechanic', label: 'Mechanic' },
      { value: 'handyman', label: 'Handyman' },
      { value: 'cleaner', label: 'Cleaner' },
      { value: 'gardener', label: 'Gardener' }
    ])
  }

  const loadProviders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Build search filters, only including defined values
      const searchFilters = {}
      
      if (filters.minRating) {
        searchFilters.min_rating = parseFloat(filters.minRating)
      }
      if (filters.maxPrice) {
        searchFilters.max_price = parseFloat(filters.maxPrice)
      }
      if (filters.category) {
        searchFilters.category = filters.category
      }
      if (filters.sortBy) {
        searchFilters.sort_by = filters.sortBy
      }

      if (filters.useLocation && userLocation) {
        searchFilters.lat = userLocation.lat
        searchFilters.lng = userLocation.lng
        searchFilters.radius = 50
      }

      // Map search query to name parameter
      if (searchQuery && searchQuery.trim()) {
        searchFilters.name = searchQuery.trim()
      }
      
      // Location can be searched via filters.location
      if (filters.location && filters.location.trim()) {
        searchFilters.location = filters.location.trim()
      }

      console.log('Searching with filters:', searchFilters)
      const response = await providerService.searchProviders(searchFilters)
      console.log('Search response:', response)
      
      if (response && response.providers) {
        setProviders(response.providers)
        setTotalPages(Math.ceil((response.count || response.providers.length) / 20))
      } else {
        setProviders([])
        setError('No providers found. Try adjusting your search criteria.')
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

  const handleFilterApply = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    loadProviders()
  }

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value)
    // Optional: Auto-search as user types (debounced)
    // For now, we'll require explicit search button click
  }

  return (
    <div className="search-container">
      {/* Top Navigation */}
      <div className="search-topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <button className="icon-button" onClick={() => navigate('/dashboard')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-search">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, location, or use filters..."
            value={searchQuery}
            onChange={handleSearchInputChange}
          />
          <button type="submit" className="search-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </form>
      </div>

      {/* Header with Filter Button */}
      <div className="search-header">
        <h2 className="search-title">Service Providers</h2>
        
        <button className="filter-button" onClick={() => setShowFilter(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
          </svg>
          <span>Filter</span>
        </button>
      </div>

      {/* Active Filters Display */}
      {(filters.category || filters.sortBy || filters.minRating || filters.maxPrice || filters.location || filters.useLocation) && (
        <div className="active-filters">
          <span className="active-filters-label">Active Filters:</span>
          {filters.sortBy && (
            <span className="filter-tag">
              {filters.sortBy === 'rating' ? 'Top Rated' : 
               filters.sortBy === 'distance' ? 'Nearby' :
               filters.sortBy === 'price_low' ? 'Price: Low to High' :
               filters.sortBy === 'price_high' ? 'Price: High to Low' : filters.sortBy}
              <button onClick={() => handleFilterApply({...filters, sortBy: ''})}>×</button>
            </span>
          )}
          {filters.category && (
            <span className="filter-tag">
              {filters.category}
              <button onClick={() => handleFilterApply({...filters, category: ''})}>×</button>
            </span>
          )}
          {filters.location && (
            <span className="filter-tag">
              Location: {filters.location}
              <button onClick={() => handleFilterApply({...filters, location: ''})}>×</button>
            </span>
          )}
          {filters.minRating && (
            <span className="filter-tag">
              {filters.minRating}+ Stars
              <button onClick={() => handleFilterApply({...filters, minRating: ''})}>×</button>
            </span>
          )}
          {filters.maxPrice && (
            <span className="filter-tag">
              Max ${filters.maxPrice}
              <button onClick={() => handleFilterApply({...filters, maxPrice: ''})}>×</button>
            </span>
          )}
          {filters.useLocation && (
            <span className="filter-tag">
              Near Me
              <button onClick={() => handleFilterApply({...filters, useLocation: false})}>×</button>
            </span>
          )}
        </div>
      )}

      {/* Filter Panel */}
      {showFilter && (
        <div className="filter-panel">
          <div className="filter-panel-header">
            <h3>Filters</h3>
            <button onClick={() => setShowFilter(false)} className="close-filter">
              ×
            </button>
          </div>
          <div className="filter-panel-content">
            <div className="filter-field">
              <label>Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterApply({...filters, category: e.target.value})}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label>Location</label>
              <Input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterApply({...filters, location: e.target.value})}
                placeholder="City or area"
              />
            </div>
            <div className="filter-field">
              <label>Min Rating</label>
              <Input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={filters.minRating}
                onChange={(e) => handleFilterApply({...filters, minRating: e.target.value})}
                placeholder="1-5"
              />
            </div>
            <div className="filter-field">
              <label>Max Price ($/hr)</label>
              <Input
                type="number"
                min="0"
                value={filters.maxPrice}
                onChange={(e) => handleFilterApply({...filters, maxPrice: e.target.value})}
                placeholder="Max hourly rate"
              />
            </div>
            <div className="filter-field">
              <label>
                <input
                  type="checkbox"
                  checked={filters.useLocation}
                  onChange={(e) => handleFilterApply({...filters, useLocation: e.target.checked})}
                />
                Show nearby only
              </label>
            </div>
            <Button onClick={() => setShowFilter(false)} variant="primary" fullWidth>
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadProviders} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {/* Providers List */}
      <div className="search-list">
        {loading ? (
          <div className="loading">Loading providers...</div>
        ) : error && providers.length === 0 ? (
          <div className="empty-state">
            <p>{error}</p>
            <p className="empty-state-hint">Please check your connection and try again</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="empty-state">
            <p>No providers found</p>
            <p className="empty-state-hint">Try adjusting your search or filters</p>
          </div>
        ) : (
          providers.map((provider) => (
            <div 
              key={provider.id} 
              className="provider-card"
              onClick={() => navigate(`/provider/${provider.id}`)}
            >
              <div className="provider-avatar">
                {provider.name ? provider.name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div className="provider-info">
                <h3 className="provider-name">{provider.name || 'Provider'}</h3>
                <p className="provider-category">{provider.category || 'Service Provider'}</p>
                {provider.service_area && (
                  <p className="provider-location">📍 {provider.service_area}</p>
                )}
                {provider.description && (
                  <p className="provider-description">{provider.description.substring(0, 60)}...</p>
                )}
              </div>
              <div className="provider-rating">
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= Math.round(provider.rating_avg || 0) ? 'filled' : ''}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="rating-text">
                  {provider.rating_avg ? provider.rating_avg.toFixed(1) : 'N/A'}
                </span>
                {provider.hourly_rate && (
                  <span className="price-text">${provider.hourly_rate}/hr</span>
                )}
                {provider.distance_km !== null && provider.distance_km !== undefined && (
                  <span className="distance-text">
                    {provider.distance_km.toFixed(1)} km away
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-button"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          
          <div className="pagination-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <button
                  key={pageNum}
                  className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span>...</span>
                <button
                  className="pagination-number"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          
          <button 
            className="pagination-button"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/location')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span>Location</span>
        </button>
        
        <button className="nav-item nav-item-notification" onClick={() => navigate('/notifications')}>
          <div style={{ position: 'relative' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
            {notificationUnreadCount > 0 && (
              <span className="nav-notification-badge">{notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}</span>
            )}
          </div>
          <span>Notification</span>
        </button>
        
        <button className="nav-item" onClick={() => navigate('/orders')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <span>Orders</span>
        </button>
        
        <button className="nav-item" onClick={() => navigate('/menu')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
          <span>Menu</span>
        </button>
      </div>
    </div>
  )
}

export default Search

