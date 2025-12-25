import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Logo, Button } from '../components'
import { providerService } from '../services/providerService'
import { userService } from '../services/userService'
import { useAuth } from '../context/AuthContext'
import './ChatExpert.css'

const CallExpert = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, updateUser } = useAuth()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [credits, setCredits] = useState(user?.profile?.credits || 35)
  const [revealedPhones, setRevealedPhones] = useState({}) // Store revealed phones by provider ID
  const [revealingProviderId, setRevealingProviderId] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState(null)
  
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
    loadCreditBalance()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      loadProviders()
    } else {
      setLoading(false)
      setProviders([])
    }
  }, [selectedCategory])

  const loadCreditBalance = async () => {
    try {
      const balance = await userService.getCreditBalance()
      setCredits(balance.credits)
    } catch (error) {
      console.error('Error loading credit balance:', error)
    }
  }

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

  const calculateCreditsForCall = (rating) => {
    if (rating === null || rating === undefined || rating === 0.0) {
      return 20 // NA
    } else if (rating >= 4.5) {
      return 20
    } else if (rating >= 4.0) {
      return 15
    } else if (rating >= 3.0) {
      return 9
    } else {
      return 5
    }
  }

  const handleProviderSelect = (provider) => {
    // Check if already revealed
    if (revealedPhones[provider.id]) {
      return // Already revealed, do nothing
    }

    const creditsNeeded = calculateCreditsForCall(provider.rating_avg)
    
    // Check if customer has enough credits
    if (credits < creditsNeeded) {
      alert(`Insufficient credits. You need ${creditsNeeded} credits to reveal contact. You have ${credits} credits.`)
      return
    }

    // Show confirmation dialog
    setSelectedProvider(provider)
    setShowConfirmDialog(true)
  }

  const handleConfirmCall = async () => {
    if (!selectedProvider) return

    setShowConfirmDialog(false)
    setRevealingProviderId(selectedProvider.id)
    
    try {
      const response = await providerService.revealContact(selectedProvider.id)
      
      if (response.success && response.phone) {
        // Store revealed phone
        setRevealedPhones(prev => ({
          ...prev,
          [selectedProvider.id]: response.phone
        }))
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
      setRevealingProviderId(null)
      setSelectedProvider(null)
    }
  }

  const handleCancelCall = () => {
    setShowConfirmDialog(false)
    setSelectedProvider(null)
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
        <h1 className="chat-expert-title">Call an Expert</h1>
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
              {providers.map((provider) => {
                const creditsNeeded = calculateCreditsForCall(provider.rating_avg)
                const isRevealed = revealedPhones[provider.id]
                const isRevealing = revealingProviderId === provider.id
                const hasEnoughCredits = credits >= creditsNeeded
                
                return (
                  <div
                    key={provider.id}
                    className="provider-card"
                    style={{
                      opacity: isRevealing ? 0.6 : 1,
                      cursor: isRevealing ? 'wait' : 'pointer'
                    }}
                    onClick={() => !isRevealed && !isRevealing && handleProviderSelect(provider)}
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
                      {isRevealed ? (
                        <div className="provider-credits" style={{ marginTop: '8px' }}>
                          <span className="credits-label" style={{ color: '#28a745', fontWeight: 'bold' }}>
                            Contact: 
                          </span>
                          <a 
                            href={`tel:${revealedPhones[provider.id]}`} 
                            style={{ 
                              color: '#007bff', 
                              textDecoration: 'none',
                              marginLeft: '8px',
                              fontSize: '16px',
                              fontWeight: 'bold'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {revealedPhones[provider.id]}
                          </a>
                        </div>
                      ) : (
                        <div className="provider-credits">
                          <span className="credits-label">Credits needed:</span>
                          <span className="credits-value" style={{ 
                            color: hasEnoughCredits ? '#28a745' : '#dc3545' 
                          }}>
                            {creditsNeeded}
                          </span>
                          {!hasEnoughCredits && (
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#dc3545', 
                              marginLeft: '8px' 
                            }}>
                              (Insufficient)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="provider-arrow">
                      {isRevealing ? (
                        <span style={{ fontSize: '12px', color: '#666' }}>Revealing...</span>
                      ) : isRevealed ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#28a745' }}>
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedProvider && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            border: '2px solid rgba(6, 182, 212, 0.3)'
          }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '16px',
              color: '#ffffff',
              fontSize: '1.25rem',
              fontWeight: 700
            }}>
              Confirm Contact Reveal
            </h3>
            <p style={{ 
              marginBottom: '8px',
              color: '#f8fafc',
              fontSize: '1rem',
              fontWeight: 600
            }}>
              <strong style={{ color: '#06b6d4' }}>{selectedProvider.name}</strong>
            </p>
            <p style={{ 
              marginBottom: '16px',
              color: '#f8fafc',
              fontSize: '0.95rem',
              lineHeight: '1.5'
            }}>
              This will deduct <strong style={{ color: '#a855f7' }}>{calculateCreditsForCall(selectedProvider.rating_avg)} credits</strong> from your account.
            </p>
            <p style={{ 
              marginBottom: '24px', 
              fontSize: '14px', 
              color: '#cbd5e1',
              lineHeight: '1.5'
            }}>
              Your remaining credits: <strong style={{ color: '#06b6d4', fontSize: '16px' }}>{credits}</strong>
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
                disabled={revealingProviderId !== null}
              >
                {revealingProviderId ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CallExpert

