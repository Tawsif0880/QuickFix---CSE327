import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button } from '../components'
import { jobService } from '../services/jobService'
import './AcceptedJobs.css'

const AcceptedJobs = () => {
  const navigate = useNavigate()
  const [acceptedJobs, setAcceptedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAcceptedJobs()
  }, [])

  const loadAcceptedJobs = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await jobService.getAcceptedJobs()
      setAcceptedJobs(response.accepted_jobs || [])
    } catch (err) {
      console.error('Error loading accepted jobs:', err)
      setError(err.response?.data?.error || 'Failed to load accepted jobs')
    } finally {
      setLoading(false)
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

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'status-accepted'
      case 'in_progress':
        return 'status-in-progress'
      case 'completed':
        return 'status-completed'
      case 'cancelled':
        return 'status-cancelled'
      default:
        return 'status-default'
    }
  }

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'Accepted'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status || 'Unknown'
    }
  }

  return (
    <div className="accepted-jobs-container">
      {/* Top Bar */}
      <div className="accepted-jobs-topbar">
        <button className="icon-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <button className="icon-button" onClick={loadAcceptedJobs}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="accepted-jobs-content">
        <h1 className="accepted-jobs-title">Accepted Jobs</h1>
        <p className="accepted-jobs-subtitle">Jobs you have accepted</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <p>Loading accepted jobs...</p>
          </div>
        ) : acceptedJobs.length === 0 ? (
          <div className="empty-state">
            <p>No accepted jobs yet</p>
            <Button
              variant="secondary"
              onClick={() => navigate('/job-board')}
              style={{ marginTop: '16px' }}
            >
              Browse Job Board
            </Button>
          </div>
        ) : (
          <div className="accepted-jobs-list">
            {acceptedJobs.map(job => (
              <div key={job.id} className="accepted-job-card">
                <div className="accepted-job-card-header">
                  <div className="job-category">{job.category}</div>
                  <div className={`job-status-badge ${getStatusBadgeClass(job.status)}`}>
                    {getStatusLabel(job.status)}
                  </div>
                </div>

                <h3 className="job-title">{job.title}</h3>
                <p className="job-description">{job.description}</p>

                <div className="job-details">
                  {job.offered_price && (
                    <div className="job-detail-item">
                      <span className="detail-label">Offered Price:</span>
                      <span className="detail-value">${parseFloat(job.offered_price).toFixed(2)}</span>
                    </div>
                  )}

                  {job.price && (
                    <div className="job-detail-item">
                      <span className="detail-label">Agreed Price:</span>
                      <span className="detail-value">${parseFloat(job.price).toFixed(2)}</span>
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

                  {job.booking && job.booking.scheduled_at && (
                    <div className="job-detail-item">
                      <span className="detail-label">Scheduled:</span>
                      <span className="detail-value">{formatDate(job.booking.scheduled_at)}</span>
                    </div>
                  )}

                  <div className="job-detail-item">
                    <span className="detail-label">Accepted:</span>
                    <span className="detail-value">{formatDate(job.created_at)}</span>
                  </div>
                </div>

                {job.booking && (
                  <div className="booking-info">
                    <div className="booking-status">
                      <span className="booking-label">Booking Status:</span>
                      <span className={`booking-status-badge ${getStatusBadgeClass(job.booking_status)}`}>
                        {getStatusLabel(job.booking_status)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AcceptedJobs
