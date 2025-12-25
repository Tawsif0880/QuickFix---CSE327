import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo, Button, Input } from '../components'
import { providerService } from '../services/providerService'
import './Settings.css'

const REDEEM_AMOUNTS = [
  { amount: 50, label: '50 Credits' },
  { amount: 100, label: '100 Credits' },
  { amount: 'all', label: 'All Credits' }
]

const Settings = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const [activeSection, setActiveSection] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Form states
  const [nameForm, setNameForm] = useState({ name: '' })
  const [contactForm, setContactForm] = useState({ phone: '' })
  const [locationForm, setLocationForm] = useState({ service_area: '' })
  const [professionForm, setProfessionForm] = useState({ category: '' })
  const [experienceForm, setExperienceForm] = useState({ description: '' })
  const [hourlyRateForm, setHourlyRateForm] = useState({ hourly_rate: '' })
  const [redeemForm, setRedeemForm] = useState({ amount: '', method: 'bank' })
  const [selectedRedeemAmount, setSelectedRedeemAmount] = useState(null)

  useEffect(() => {
    // Load current user data
    if (user?.profile) {
      setNameForm({ name: user.profile.name || '' })
      setContactForm({ phone: user.profile.phone || '' })
      setLocationForm({ service_area: user.profile.service_area || '' })
      setProfessionForm({ category: user.profile.category || '' })
      setExperienceForm({ description: user.profile.description || '' })
      setHourlyRateForm({ hourly_rate: user.profile.hourly_rate || '' })
    }
  }, [user])

  const handleUpdateName = async (e) => {
    e.preventDefault()
    if (!nameForm.name.trim()) {
      setMessage({ type: 'error', text: 'Name cannot be empty' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await providerService.updateProfile({ name: nameForm.name })
      setMessage({ type: 'success', text: 'Name updated successfully!' })
      await updateUser()
      setTimeout(() => {
        setActiveSection(null)
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update name' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateContact = async (e) => {
    e.preventDefault()
    if (!contactForm.phone.trim()) {
      setMessage({ type: 'error', text: 'Phone number cannot be empty' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await providerService.updateProfile({ phone: contactForm.phone })
      setMessage({ type: 'success', text: 'Contact number updated successfully!' })
      await updateUser()
      setTimeout(() => {
        setActiveSection(null)
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update contact' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateLocation = async (e) => {
    e.preventDefault()
    if (!locationForm.service_area.trim()) {
      setMessage({ type: 'error', text: 'Preferred location cannot be empty' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await providerService.updateProfile({ service_area: locationForm.service_area })
      setMessage({ type: 'success', text: 'Preferred location updated successfully!' })
      await updateUser()
      setTimeout(() => {
        setActiveSection(null)
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update location' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfession = async (e) => {
    e.preventDefault()
    if (!professionForm.category.trim()) {
      setMessage({ type: 'error', text: 'Profession cannot be empty' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await providerService.updateProfile({ category: professionForm.category })
      setMessage({ type: 'success', text: 'Profession updated successfully!' })
      await updateUser()
      setTimeout(() => {
        setActiveSection(null)
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update profession' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateExperience = async (e) => {
    e.preventDefault()
    if (!experienceForm.description.trim()) {
      setMessage({ type: 'error', text: 'Experience cannot be empty' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await providerService.updateProfile({ description: experienceForm.description })
      setMessage({ type: 'success', text: 'Experience updated successfully!' })
      await updateUser()
      setTimeout(() => {
        setActiveSection(null)
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update experience' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateHourlyRate = async (e) => {
    e.preventDefault()
    const rate = parseFloat(hourlyRateForm.hourly_rate)
    if (isNaN(rate) || rate < 0) {
      setMessage({ type: 'error', text: 'Please enter a valid hourly rate' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await providerService.updateProfile({ hourly_rate: rate })
      setMessage({ type: 'success', text: 'Hourly rate updated successfully!' })
      await updateUser()
      setTimeout(() => {
        setActiveSection(null)
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update hourly rate' })
    } finally {
      setLoading(false)
    }
  }

  const handleRedeemCredits = async (e) => {
    e.preventDefault()
    
    if (!selectedRedeemAmount && !redeemForm.amount) {
      setMessage({ type: 'error', text: 'Please select or enter an amount to redeem' })
      return
    }

    if (redeemForm.method !== 'bank') {
      setMessage({ type: 'error', text: 'Only bank payment method is supported' })
      return
    }

    const currentCredits = user?.profile?.credits || 20
    let redeemAmount = 0

    if (selectedRedeemAmount === 'all') {
      redeemAmount = currentCredits
    } else if (selectedRedeemAmount) {
      redeemAmount = selectedRedeemAmount
    } else {
      redeemAmount = parseFloat(redeemForm.amount)
    }

    if (isNaN(redeemAmount) || redeemAmount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' })
      return
    }

    if (redeemAmount > currentCredits) {
      setMessage({ type: 'error', text: `You only have ${currentCredits} credits available` })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await providerService.redeemCredits(redeemAmount, redeemForm.method)
      setMessage({ type: 'success', text: 'Bank transfer initiated (fake)' })
      await updateUser()
      setSelectedRedeemAmount(null)
      setRedeemForm({ amount: '', method: 'bank' })
      setTimeout(() => {
        setActiveSection(null)
        setMessage({ type: '', text: '' })
      }, 2000)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to redeem credits. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const settingsOptions = [
    {
      id: 'name',
      title: 'Change Name',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      currentValue: user?.profile?.name || 'Not set'
    },
    {
      id: 'contact',
      title: 'Change Contact',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ),
      currentValue: user?.profile?.phone || 'Not set'
    },
    {
      id: 'location',
      title: 'Your Preferred Location',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      currentValue: user?.profile?.service_area || 'Not set'
    },
    {
      id: 'profession',
      title: 'Change Profession',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 4h4v3h-4V4z"/>
        </svg>
      ),
      currentValue: user?.profile?.category || 'Not set'
    },
    {
      id: 'experience',
      title: 'Change Experience',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      currentValue: user?.profile?.description ? (user.profile.description.length > 50 ? user.profile.description.substring(0, 50) + '...' : user.profile.description) : 'Not set'
    },
    {
      id: 'hourlyRate',
      title: 'Change Hourly Rate',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      currentValue: user?.profile?.hourly_rate ? `$${user.profile.hourly_rate}/hr` : 'Not set'
    },
    {
      id: 'buyCredits',
      title: 'Buy Credits',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      currentValue: `${user?.profile?.credits !== undefined ? user.profile.credits.toFixed(2) : 20.0} credits available`
    },
    {
      id: 'redeemCredits',
      title: 'Redeem Credits',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      currentValue: `${user?.profile?.credits !== undefined ? user.profile.credits.toFixed(2) : 20.0} credits available`
    }
  ]

  return (
    <div className="settings-container">
      {/* Top Bar */}
      <div className="settings-topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Settings Header */}
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your provider information</p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Settings Options */}
      <div className="settings-options">
        {settingsOptions.map((option) => (
          <div key={option.id} className="settings-option">
            <button
              className="settings-option-button"
              onClick={() => {
                setActiveSection(activeSection === option.id ? null : option.id)
                setMessage({ type: '', text: '' })
              }}
            >
              <div className="settings-option-left">
                <div className="settings-option-icon">{option.icon}</div>
                <div className="settings-option-content">
                  <h3 className="settings-option-title">{option.title}</h3>
                  <p className="settings-option-value">{option.currentValue}</p>
                </div>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`settings-option-arrow ${activeSection === option.id ? 'open' : ''}`}
              >
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>

            {/* Expandable Form Section */}
            {activeSection === option.id && (
              <div className="settings-form-section">
                {option.id === 'name' && (
                  <form onSubmit={handleUpdateName} className="settings-form">
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      value={nameForm.name}
                      onChange={(e) => setNameForm({ name: e.target.value })}
                      required
                    />
                    <div className="settings-form-actions">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setActiveSection(null)
                          setNameForm({ name: user?.profile?.name || '' })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </form>
                )}

                {option.id === 'contact' && (
                  <form onSubmit={handleUpdateContact} className="settings-form">
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ phone: e.target.value })}
                      required
                    />
                    <div className="settings-form-actions">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setActiveSection(null)
                          setContactForm({ phone: user?.profile?.phone || '' })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </form>
                )}

                {option.id === 'location' && (
                  <form onSubmit={handleUpdateLocation} className="settings-form">
                    <textarea
                      className="settings-textarea"
                      placeholder="Enter your preferred service area"
                      value={locationForm.service_area}
                      onChange={(e) => setLocationForm({ service_area: e.target.value })}
                      rows="3"
                      required
                    />
                    <div className="settings-form-actions">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setActiveSection(null)
                          setLocationForm({ service_area: user?.profile?.service_area || '' })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </form>
                )}

                {option.id === 'profession' && (
                  <form onSubmit={handleUpdateProfession} className="settings-form">
                    <Input
                      type="text"
                      placeholder="Enter your profession (e.g., Plumber, Electrician)"
                      value={professionForm.category}
                      onChange={(e) => setProfessionForm({ category: e.target.value })}
                      required
                    />
                    <div className="settings-form-actions">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setActiveSection(null)
                          setProfessionForm({ category: user?.profile?.category || '' })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </form>
                )}

                {option.id === 'experience' && (
                  <form onSubmit={handleUpdateExperience} className="settings-form">
                    <textarea
                      className="settings-textarea"
                      placeholder="Describe your experience and expertise"
                      value={experienceForm.description}
                      onChange={(e) => setExperienceForm({ description: e.target.value })}
                      rows="5"
                      required
                    />
                    <div className="settings-form-actions">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setActiveSection(null)
                          setExperienceForm({ description: user?.profile?.description || '' })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </form>
                )}

                {option.id === 'hourlyRate' && (
                  <form onSubmit={handleUpdateHourlyRate} className="settings-form">
                    <Input
                      type="number"
                      placeholder="Enter your hourly rate"
                      value={hourlyRateForm.hourly_rate}
                      onChange={(e) => setHourlyRateForm({ hourly_rate: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                    />
                    <div className="settings-form-actions">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setActiveSection(null)
                          setHourlyRateForm({ hourly_rate: user?.profile?.hourly_rate || '' })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </form>
                )}

                {option.id === 'buyCredits' && (
                  <div className="settings-form-section">
                    <div className="buy-credits-redirect">
                      <p className="buy-credits-text">Purchase credits to use for accepting jobs</p>
                      <Button
                        variant="primary"
                        onClick={() => navigate('/buy-credits')}
                        className="buy-credits-button"
                      >
                        Go to Buy Credits
                      </Button>
                    </div>
                  </div>
                )}

                {option.id === 'redeemCredits' && (
                  <form onSubmit={handleRedeemCredits} className="settings-form">
                    <div className="redeem-credits-section">
                      <div className="current-credits-display">
                        <span className="current-credits-label">Current Credits:</span>
                        <span className="current-credits-amount">{user?.profile?.credits !== undefined ? user.profile.credits : 20}</span>
                      </div>
                      
                      <div className="redeem-amount-section">
                        <h3 className="redeem-subtitle">Select Amount</h3>
                        <div className="redeem-amount-buttons">
                          {REDEEM_AMOUNTS.map((item) => {
                            const amount = item.amount === 'all' 
                              ? (user?.profile?.credits || 20) 
                              : item.amount
                            const isDisabled = amount > (user?.profile?.credits || 20)
                            
                            return (
                              <button
                                key={item.amount}
                                type="button"
                                className={`redeem-amount-button ${selectedRedeemAmount === item.amount ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                onClick={() => {
                                  if (!isDisabled) {
                                    setSelectedRedeemAmount(item.amount)
                                    setRedeemForm({ ...redeemForm, amount: '' })
                                    setMessage({ type: '', text: '' })
                                  }
                                }}
                                disabled={isDisabled}
                              >
                                {item.label}
                              </button>
                            )
                          })}
                        </div>
                        <div className="redeem-or">OR</div>
                        <Input
                          type="number"
                          placeholder="Enter custom amount"
                          value={redeemForm.amount}
                          onChange={(e) => {
                            setRedeemForm({ ...redeemForm, amount: e.target.value })
                            setSelectedRedeemAmount(null)
                            setMessage({ type: '', text: '' })
                          }}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="redeem-method-section">
                        <h3 className="redeem-subtitle">Payment Method</h3>
                        <label className={`redeem-method-option ${redeemForm.method === 'bank' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="redeem_method"
                            value="bank"
                            checked={redeemForm.method === 'bank'}
                            onChange={(e) => setRedeemForm({ ...redeemForm, method: e.target.value })}
                          />
                          <div className="redeem-method-content">
                            <div className="redeem-method-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                                <line x1="1" y1="10" x2="23" y2="10"/>
                              </svg>
                            </div>
                            <div className="redeem-method-details">
                              <div className="redeem-method-name">Bank</div>
                              <div className="redeem-method-desc">Bank transfer (fake)</div>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                    <div className="settings-form-actions">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setActiveSection(null)
                          setSelectedRedeemAmount(null)
                          setRedeemForm({ amount: '', method: 'bank' })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading || (!selectedRedeemAmount && !redeemForm.amount)}>
                        {loading ? 'Processing...' : 'Redeem'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        ))}
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

export default Settings

