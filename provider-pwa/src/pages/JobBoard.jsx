import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button } from '../components'
import { jobService } from '../services/jobService'
import { useAuth } from '../context/AuthContext'
import './JobBoard.css'

const JobBoard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [providerAvailability, setProviderAvailability] = useState(true)
  const [providerCredits, setProviderCredits] = useState(0)
  const [acceptingJobId, setAcceptingJobId] = useState(null)
  const [savingJobId, setSavingJobId] = useState(null)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await jobService.getOpenJobs()
      setJobs(response.jobs || [])
      setProviderAvailability(response.provider_availability !== false)
      setProviderCredits(response.provider_credits || 0)
    } catch (err) {
      console.error('Error loading jobs:', err)
      setError(err.response?.data?.error || 'Failed to load jobs')
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
      
      // Update provider credits if returned
      if (response.remaining_credits !== undefined) {
        setProviderCredits(response.remaining_credits)
      }
      
      // Remove accepted job from list
      setJobs(prev => prev.filter(job => job.id !== jobId))
      
      // Show success message or navigate
      alert('Job accepted successfully!')
      
      // Reload jobs to get updated credit balance
      loadJobs()
      
      // Optionally navigate to accepted jobs
      // navigate('/accepted-jobs')
    } catch (err) {
      console.error('Error accepting job:', err)
      const errorMsg = err.response?.data?.error || 'Failed to accept job'
      const errorData = err.response?.data
      
      // Handle insufficient credits error
      if (err.response?.status === 400 && (errorMsg === 'INSUFFICIENT_CREDITS' || errorData?.error === 'INSUFFICIENT_CREDITS')) {
        setError(errorData?.message || 'Insufficient credits to accept this job')
        // Reload jobs to get updated credit balance
        loadJobs()
      } else {
      setError(errorMsg)
      // If job was already accepted, reload the list
      if (err.response?.status === 409 || errorMsg.includes('already been accepted')) {
        loadJobs()
        }
      }
    } finally {
      setAcceptingJobId(null)
    }
  }

  const handleSave = async (jobId) => {
    try {
      setSavingJobId(jobId)
      setError('')
      await jobService.saveJob(jobId)
      
      // Update job to show it's saved
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, is_saved: true } : job
      ))
      
      alert('Job saved successfully!')
    } catch (err) {
      console.error('Error saving job:', err)
      setError(err.response?.data?.error || 'Failed to save job')
    } finally {
      setSavingJobId(null)
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

  return (
    <div className="job-board-container">
      {/* Top Bar */}
      <div className="job-board-topbar">
        <button className="icon-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <button className="icon-button" onClick={loadJobs}>
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
      <div className="job-board-content">
        <h1 className="job-board-title">Job Board</h1>
        <p className="job-board-subtitle">Browse available service requests</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <p>Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <p>No open jobs available at the moment</p>
          </div>
        ) : (
          <div className="jobs-list">
            {jobs.map(job => {
              // Calculate acceptance cost (5% of offered price)
              const acceptanceCost = job.offered_price ? (job.offered_price * 0.05) : 0
              const hasValidPrice = job.offered_price && job.offered_price > 0
              const hasEnoughCredits = providerCredits >= acceptanceCost
              const canAccept = providerAvailability && job.status === 'OPEN' && !job.provider_id && hasValidPrice && hasEnoughCredits
              const isAccepting = acceptingJobId === job.id
              const isSaving = savingJobId === job.id

              return (
                <div key={job.id} className="job-card">
                  <div className="job-card-header">
                    <div className="job-category">{job.category}</div>
                    {job.is_saved && (
                      <span className="saved-badge">Saved</span>
                    )}
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

                    {job.offered_price && (
                      <div className="job-detail-item">
                        <span className="detail-label">Acceptance cost:</span>
                        <span className="detail-value">{acceptanceCost.toFixed(2)} credits (5%)</span>
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
                  </div>

                  <div className="job-actions">
                    <Button
                      variant="primary"
                      onClick={() => handleAccept(job.id)}
                      disabled={!canAccept || isAccepting || isSaving}
                      className="accept-button"
                      title={!hasEnoughCredits && job.offered_price ? `Not enough credits. Required: ${acceptanceCost.toFixed(2)}, Available: ${providerCredits.toFixed(2)}` : ''}
                    >
                      {isAccepting ? 'Accepting...' : 'Accept Now'}
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() => handleSave(job.id)}
                      disabled={isAccepting || isSaving || job.is_saved}
                      className="save-button"
                    >
                      {isSaving ? 'Saving...' : job.is_saved ? 'Saved' : 'Save for Later'}
                    </Button>
                  </div>

                  {!canAccept && job.status === 'OPEN' && (
                    <div className="job-status-note">
                      {!providerAvailability 
                        ? 'You must be available to accept jobs'
                        : !hasValidPrice
                        ? 'This job has no valid price'
                        : !hasEnoughCredits
                        ? `Not enough credits. Required: ${acceptanceCost.toFixed(2)}, Available: ${providerCredits.toFixed(2)}`
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

export default JobBoard
