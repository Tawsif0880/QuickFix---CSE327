import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo, Button, Input } from '../components'
import { userService } from '../services/userService'
import { useNotificationCount } from '../hooks/useNotificationCount'
import './Settings.css'

const Settings = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const { unreadCount: notificationUnreadCount } = useNotificationCount()
  const [activeSection, setActiveSection] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Form states
  const [nameForm, setNameForm] = useState({ name: '' })
  const [contactForm, setContactForm] = useState({ phone: '' })
  const [addressForm, setAddressForm] = useState({ address: '' })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    // Load current user data
    if (user?.profile) {
      setNameForm({ name: user.profile.name || '' })
      setContactForm({ phone: user.profile.phone || '' })
      setAddressForm({ address: user.profile.address || '' })
    }
  }, [user])

  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }, [selectedFile])

  const handleUpdateName = async (e) => {
    e.preventDefault()
    if (!nameForm.name.trim()) {
      setMessage({ type: 'error', text: 'Name cannot be empty' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await userService.updateProfile({ name: nameForm.name })
      setMessage({ type: 'success', text: 'Name updated successfully!' })
      // Refresh user data
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
      await userService.updateProfile({ phone: contactForm.phone })
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

  const handleUpdateAddress = async (e) => {
    e.preventDefault()
    if (!addressForm.address.trim()) {
      setMessage({ type: 'error', text: 'Address cannot be empty' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await userService.updateProfile({ address: addressForm.address })
      setMessage({ type: 'success', text: 'Address updated successfully!' })
      await updateUser()
      setTimeout(() => {
        setActiveSection(null)
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update address' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'All password fields are required' })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await userService.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setTimeout(() => {
        setActiveSection(null)
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to change password. Please check your current password.' })
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage({ type: 'error', text: 'File size must be less than 5MB' })
        return
      }
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' })
        return
      }
      setSelectedFile(file)
      setMessage({ type: '', text: '' })
    }
  }

  const handleUploadPicture = async (e) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a picture first' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await userService.uploadProfilePicture(selectedFile)
      setMessage({ type: 'success', text: 'Profile picture uploaded successfully!' })
      await updateUser()
      setTimeout(() => {
        setActiveSection(null)
        setSelectedFile(null)
        setPreview(null)
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to upload picture' })
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
      id: 'address',
      title: 'Set Address',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      currentValue: user?.profile?.address || 'Not set'
    },
    {
      id: 'password',
      title: 'Change Password',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      currentValue: '••••••••'
    },
    {
      id: 'picture',
      title: 'Upload Picture',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      ),
      currentValue: 'No picture uploaded'
    },
    {
      id: 'credits',
      title: 'Buy Credits',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      currentValue: `${user?.profile?.credits !== undefined ? user.profile.credits : 35} credits available`
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
        <p className="settings-subtitle">Manage your account information</p>
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

                {option.id === 'address' && (
                  <form onSubmit={handleUpdateAddress} className="settings-form">
                    <textarea
                      className="settings-textarea"
                      placeholder="Enter your address"
                      value={addressForm.address}
                      onChange={(e) => setAddressForm({ address: e.target.value })}
                      rows="4"
                      required
                    />
                    <div className="settings-form-actions">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setActiveSection(null)
                          setAddressForm({ address: user?.profile?.address || '' })
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

                {option.id === 'password' && (
                  <form onSubmit={handleChangePassword} className="settings-form">
                    <Input
                      type="password"
                      placeholder="Current password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                    />
                    <Input
                      type="password"
                      placeholder="New password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />
                    <div className="settings-form-actions">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setActiveSection(null)
                          setPasswordForm({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Changing...' : 'Change Password'}
                      </Button>
                    </div>
                  </form>
                )}

                {option.id === 'picture' && (
                  <form onSubmit={handleUploadPicture} className="settings-form">
                    <div className="settings-picture-upload">
                      <input
                        type="file"
                        id="picture-upload"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="settings-file-input"
                      />
                      <label htmlFor="picture-upload" className="settings-file-label">
                        {preview ? (
                          <img src={preview} alt="Preview" className="settings-preview" />
                        ) : (
                          <div className="settings-upload-placeholder">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="17 8 12 3 7 8"/>
                              <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            <span>Click to select image</span>
                          </div>
                        )}
                      </label>
                    </div>
                    <div className="settings-form-actions">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setActiveSection(null)
                          setSelectedFile(null)
                          setPreview(null)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading || !selectedFile}>
                        {loading ? 'Uploading...' : 'Upload Picture'}
                      </Button>
                    </div>
                  </form>
                )}

                {option.id === 'credits' && (
                  <div className="settings-form">
                    <Button
                      type="button"
                      onClick={() => navigate('/buy-credits')}
                      style={{ width: '100%' }}
                    >
                      Go to Buy Credits
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

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

export default Settings

