import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components'
import { providerService } from '../services/providerService'
import api from '../services/api'
import './Profile.css'

const Profile = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Fetch full profile data from the API
        const response = await api.get('/users/profile')
        setUserData(response.data)
      } catch (error) {
        console.error('Error fetching profile:', error)
        // Fallback to auth context user data
        if (authUser) {
          setUserData(authUser)
        }
      } finally {
        setLoading(false)
      }
    }

    if (authUser) {
      fetchUserProfile()
    } else {
      setLoading(false)
    }
  }, [authUser])

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="profile-container">
        <div className="error">Unable to load profile</div>
      </div>
    )
  }

  const profile = userData.profile || {}
  const displayName = profile.name || authUser?.name || 'Provider'

  return (
    <div className="profile-container">
      {/* Top Bar */}
      <div className="profile-topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <h1 className="profile-name">{displayName}</h1>
        {profile.rating_avg !== undefined && (
          <div className="profile-rating">
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= Math.round(profile.rating_avg) ? 'filled' : ''}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="rating-value">{profile.rating_avg.toFixed(1)}</span>
            {profile.rating_count !== undefined && (
              <span className="rating-count">({profile.rating_count} reviews)</span>
            )}
          </div>
        )}
        {profile.verified && (
          <div className="verified-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Verified Provider</span>
          </div>
        )}
      </div>

      {/* Profile Information */}
      <div className="profile-content">
        <div className="profile-section">
          <h2 className="section-title">Contact Information</h2>
          
          <div className="info-item">
            <div className="info-label">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>Email</span>
            </div>
            <div className="info-value">{userData.email || 'N/A'}</div>
          </div>

          {profile.phone && (
            <div className="info-item">
              <div className="info-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>Contact</span>
              </div>
              <div className="info-value">{profile.phone}</div>
            </div>
          )}
        </div>

        <div className="profile-section">
          <h2 className="section-title">Professional Information</h2>
          
          {profile.category && (
            <div className="info-item">
              <div className="info-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 4h4v3h-4V4z"/>
                </svg>
                <span>Profession</span>
              </div>
              <div className="info-value">{profile.category}</div>
            </div>
          )}

          {profile.service_area && (
            <div className="info-item">
              <div className="info-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>Preferred Area</span>
              </div>
              <div className="info-value">{profile.service_area}</div>
            </div>
          )}

          {profile.description && (
            <div className="info-item">
              <div className="info-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <span>Experience</span>
              </div>
              <div className="info-value">{profile.description}</div>
            </div>
          )}

          {profile.hourly_rate !== null && profile.hourly_rate !== undefined && (
            <div className="info-item">
              <div className="info-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                <span>Hourly Rate</span>
              </div>
              <div className="info-value">${profile.hourly_rate}/hr</div>
            </div>
          )}
        </div>

        <div className="profile-section">
          <h2 className="section-title">Account Information</h2>
          
          <div className="info-item">
            <div className="info-label">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>Credits</span>
            </div>
            <div className="info-value credits-display">
              <span className="credits-amount">{profile.credits !== undefined ? profile.credits : 20}</span>
              <span className="credits-label">credits</span>
            </div>
          </div>
          
          <div className="info-item">
            <div className="info-label">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <path d="M20 8v6M23 11h-6"/>
              </svg>
              <span>Role</span>
            </div>
            <div className="info-value">{userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'N/A'}</div>
          </div>

          {userData.created_at && (
            <div className="info-item">
              <div className="info-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Member Since</span>
              </div>
              <div className="info-value">
                {new Date(userData.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          )}

          <div className="info-item">
            <div className="info-label">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                <path d="M12 3c0 1-1 3-3 3S6 4 6 3s1-3 3-3 3 2 3 3z"/>
                <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3z"/>
              </svg>
              <span>Status</span>
            </div>
            <div className="info-value">
              <span className={`status-badge ${userData.is_active ? 'active' : 'inactive'}`}>
                {userData.is_active ? 'Active' : 'Inactive'}
              </span>
              {profile.is_available !== undefined && (
                <span className={`status-badge ${profile.is_available ? 'available' : 'unavailable'}`}>
                  {profile.is_available ? 'Available' : 'Unavailable'}
                </span>
              )}
            </div>
          </div>
        </div>
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

export default Profile

