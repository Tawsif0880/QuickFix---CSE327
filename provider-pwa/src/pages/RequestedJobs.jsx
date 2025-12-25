import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button } from '../components'
import { jobService } from '../services/jobService'
import './RequestedJobs.css'

const RequestedJobs = () => {
  const navigate = useNavigate()
  const [requestedJobs, setRequestedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acceptingJobId, setAcceptingJobId] = useState(null)
  const [rejectingJobId, setRejectingJobId] = useState(null)

  useEffect(() => {
    loadRequestedJobs()
  }, [])

  const loadRequestedJobs = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await jobService.getRequestedJobs()
      setRequestedJobs(response.requested_jobs || [])
    } catch (err) {
      console.error('Error loading requested jobs:', err)
      setError(err.response?.data?.error || 'Failed to load requested jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (jobId) => {
    try {
      setAcceptingJobId(jobId)
      setError('')
      await jobService.acceptRequestedJob(jobId)
      // Reload the list (accepted job will no longer appear in requested jobs)
      await loadRequestedJobs()
      // Optionally navigate to accepted jobs
      // navigate('/accepted-jobs')
    } catch (err) {
      console.error('Error accepting job:', err)
      setError(err.response?.data?.error || 'Failed to accept job')
    } finally {
      setAcceptingJobId(null)
    }
  }

  const handleReject = async (jobId) => {
    if (!window.confirm('Are you sure you want to reject this job? This action cannot be undone.')) {
      return
    }

    try {
      setRejectingJobId(jobId)
      setError('')
      await jobService.rejectRequestedJob(jobId)
      // Reload the list (rejected job will no longer appear)
      await loadRequestedJobs()
    } catch (err) {
      console.error('Error rejecting job:', err)
      setError(err.response?.data?.error || 'Failed to reject job')
    } finally {
      setRejectingJobId(null)
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
    <div className="requested-jobs-container">
      {/* Top Bar */}
      <div className="requested-jobs-topbar">
        <button className="icon-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <button className="icon-button" onClick={loadRequestedJobs}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="requested-jobs-content">
        <h1 className="requested-jobs-title">Requested Jobs</h1>
        <p className="requested-jobs-subtitle">Service requests sent directly to you</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <p>Loading requested jobs...</p>
          </div>
        ) : requestedJobs.length === 0 ? (
          <div className="empty-state">
            <p>No requested jobs yet</p>
            <Button
              variant="secondary"
              onClick={() => navigate('/job-board')}
              style={{ marginTop: '16px' }}
            >
              Browse Job Board
            </Button>
          </div>
        ) : (
          <div className="requested-jobs-list">
            {requestedJobs.map(job => (
              <div key={job.id} className="requested-job-card">
                <div className="requested-job-card-header">
                  <div className="job-category">{job.category}</div>
                  <div className="job-status-badge status-requested">
                    Requested
                  </div>
                </div>

                {job.customer && (
                  <div className="customer-name">
                    <strong>Customer:</strong> {job.customer.name || 'N/A'}
                  </div>
                )}

                <h3 className="job-title">{job.title}</h3>
                <p className="job-description">{job.description}</p>

                <div className="job-details">
                  {job.offered_price && (
                    <div className="job-detail-item">
                      <span className="detail-label">Offered Price:</span>
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
                      <span className="detail-label">Requested Date:</span>
                      <span className="detail-value">{formatDate(job.preferred_date)}</span>
                    </div>
                  )}

                  <div className="job-detail-item">
                    <span className="detail-label">Requested:</span>
                    <span className="detail-value">{formatDate(job.created_at)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="requested-job-actions">
                  <Button
                    variant="secondary"
                    onClick={() => handleReject(job.id)}
                    disabled={rejectingJobId === job.id || acceptingJobId === job.id}
                    style={{ 
                      flex: 1,
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    {rejectingJobId === job.id ? 'Rejecting...' : '❌ Reject'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleAccept(job.id)}
                    disabled={acceptingJobId === job.id || rejectingJobId === job.id}
                    style={{ flex: 1 }}
                  >
                    {acceptingJobId === job.id ? 'Accepting...' : '✅ Accept'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RequestedJobs
