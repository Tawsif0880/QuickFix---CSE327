import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button } from '../components'
import { jobService } from '../services/jobService'
import { useAuth } from '../context/AuthContext'
import './SavedJobs.css'

const SavedJobs = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [savedJobs, setSavedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [providerAvailability, setProviderAvailability] = useState(true)
  const [acceptingJobId, setAcceptingJobId] = useState(null)

  useEffect(() => {
    loadSavedJobs()
  }, [])

  const loadSavedJobs = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await jobService.getSavedJobs()
      setSavedJobs(response.saved_jobs || [])
      setProviderAvailability(response.provider_availability !== false)
    } catch (err) {
      console.error('Error loading saved jobs:', err)
      setError(err.response?.data?.error || 'Failed to load saved jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (jobId) => {
    if (!providerAvailability) {
      setError('You must be available to accept jobs')
      return
    }

    try {
      setAcceptingJobId(jobId)
      setError('')
      const response = await jobService.acceptJob(jobId)
      
      // Remove accepted job from saved list
      setSavedJobs(prev => prev.filter(job => job.id !== jobId))
      
      alert('Job accepted successfully!')
    } catch (err) {
      console.error('Error accepting job:', err)
      const errorMsg = err.response?.data?.error || 'Failed to accept job'
      setError(errorMsg)
      
      // If job was already accepted or unavailable, reload the list
      if (err.response?.status === 409 || errorMsg.includes('no longer available')) {
        loadSavedJobs()
      }
    } finally {
      setAcceptingJobId(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getJobStatusLabel = (job) => {
    if (job.status === 'ACCEPTED') {
      return 'Accepted by another provider'
    }
    if (job.status === 'CLOSED') {
      return 'Closed'
    }
    return 'Available'
  }

  return (
    <div className="saved-jobs-container">
      {/* Top Bar */}
      <div className="saved-jobs-topbar">
        <button className="icon-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <button className="icon-button" onClick={loadSavedJobs}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
          </svg>
        </button>
      </div>

      {/* Availability Badge */}
      <div className={`availability-badge ${providerAvailability ? 'available' : 'unavailable'}`}>
        <span className="availability-dot"></span>
        <span>{providerAvailability ? 'Available' : 'Not Available'}</span>
      </div>

      {/* Content */}
      <div className="saved-jobs-content">
        <h1 className="saved-jobs-title">Saved Jobs</h1>
        <p className="saved-jobs-subtitle">Your saved service requests</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <p>Loading saved jobs...</p>
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="empty-state">
            <p>No saved jobs yet</p>
            <Button
              variant="secondary"
              onClick={() => navigate('/job-board')}
              style={{ marginTop: '16px' }}
            >
              Browse Job Board
            </Button>
          </div>
        ) : (
          <div className="saved-jobs-list">
            {savedJobs.map(job => {
              const canAccept = job.can_accept && providerAvailability
              const isAccepting = acceptingJobId === job.id
              const isUnavailable = job.status !== 'OPEN' || job.provider_id

              return (
                <div key={job.id} className="saved-job-card">
                  <div className="saved-job-card-header">
                    <div className="job-category">{job.category}</div>
                    <div className={`job-status-badge ${isUnavailable ? 'unavailable' : 'available'}`}>
                      {getJobStatusLabel(job)}
                    </div>
                  </div>

                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-description">{job.description}</p>

                  <div className="job-details">
                    {job.offered_price && (
                      <div className="job-detail-item">
                        <span className="detail-label">Price:</span>
                        <span className="detail-value">${parseFloat(job.offered_price).toFixed(2)}</span>
                      </div>
                    )}

                    {job.location_address && (
                      <div className="job-detail-item">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value">{job.location_address}</span>
                      </div>
                    )}

                    {job.preferred_date && (
                      <div className="job-detail-item">
                        <span className="detail-label">Preferred Date:</span>
                        <span className="detail-value">{formatDate(job.preferred_date)}</span>
                      </div>
                    )}

                    {job.customer && (
                      <div className="job-detail-item">
                        <span className="detail-label">Customer:</span>
                        <span className="detail-value">{job.customer.name || 'N/A'}</span>
                      </div>
                    )}

                    {job.saved_at && (
                      <div className="job-detail-item">
                        <span className="detail-label">Saved:</span>
                        <span className="detail-value">{formatDate(job.saved_at)}</span>
                      </div>
                    )}
                  </div>

                  <div className="job-actions">
                    <Button
                      variant="primary"
                      onClick={() => handleAccept(job.id)}
                      disabled={!canAccept || isAccepting}
                      className="accept-button"
                      fullWidth
                    >
                      {isAccepting ? 'Accepting...' : 'Accept Now'}
                    </Button>
                  </div>

                  {!canAccept && (
                    <div className="job-status-note">
                      {!providerAvailability
                        ? 'You must be available to accept jobs'
                        : isUnavailable
                        ? getJobStatusLabel(job)
                        : 'This job is no longer available'
                      }
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default SavedJobs
