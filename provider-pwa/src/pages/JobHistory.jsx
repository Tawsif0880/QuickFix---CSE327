import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components'
import { jobService } from '../services/jobService'
import './JobHistory.css'

const JobHistory = () => {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, completed, reported

  useEffect(() => {
    loadJobHistory()
  }, [])

  const loadJobHistory = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await jobService.getJobHistory()
      setJobs(response.jobs || [])
    } catch (err) {
      console.error('Error loading job history:', err)
      setError(err.response?.data?.error || 'Failed to load job history')
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
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'status-completed'
      case 'REPORTED':
        return 'status-reported'
      default:
        return 'status-default'
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true
    if (filter === 'completed') return job.status?.toUpperCase() === 'COMPLETED'
    if (filter === 'reported') return job.status?.toUpperCase() === 'REPORTED'
    return true
  })

  return (
    <div className="job-history-container">
      {/* Top Bar */}
      <div className="job-history-topbar">
        <button className="icon-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <button className="icon-button" onClick={loadJobHistory}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="job-history-content">
        <h1 className="job-history-title">Job History</h1>
        <p className="job-history-subtitle">Your completed and reported jobs</p>

        {/* Filter Tabs */}
        <div className="history-filters">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({jobs.length})
          </button>
          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({jobs.filter(j => j.status?.toUpperCase() === 'COMPLETED').length})
          </button>
          <button
            className={`filter-tab ${filter === 'reported' ? 'active' : ''}`}
            onClick={() => setFilter('reported')}
          >
            Reported ({jobs.filter(j => j.status?.toUpperCase() === 'REPORTED').length})
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <p>Loading job history...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            <p>No jobs in history yet</p>
          </div>
        ) : (
          <div className="job-history-list">
            {filteredJobs.map(job => (
              <div key={job.id} className="history-job-card">
                <div className="history-job-header">
                  <div className="job-badges">
                    {job.is_emergency && (
                      <span className="emergency-badge">EMERGENCY</span>
                    )}
                    <span className={`status-badge ${getStatusBadgeClass(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  <span className="job-category">{job.category}</span>
                </div>

                <h3 className="job-title">{job.title}</h3>
                <p className="job-description">{job.description}</p>

                <div className="job-details">
                  {job.customer && (
                    <div className="job-detail-item">
                      <span className="detail-label">Customer:</span>
                      <span className="detail-value">{job.customer.name || 'N/A'}</span>
                    </div>
                  )}

                  {job.price && (
                    <div className="job-detail-item">
                      <span className="detail-label">Price:</span>
                      <span className="detail-value">${parseFloat(job.price).toFixed(2)}</span>
                    </div>
                  )}

                  {job.location_address && (
                    <div className="job-detail-item">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{job.location_address}</span>
                    </div>
                  )}

                  {job.completed_at && (
                    <div className="job-detail-item">
                      <span className="detail-label">
                        {job.status?.toUpperCase() === 'REPORTED' ? 'Reported:' : 'Completed:'}
                      </span>
                      <span className="detail-value">{formatDate(job.completed_at)}</span>
                    </div>
                  )}

                  {job.report_reason && (
                    <div className="job-detail-item report-reason">
                      <span className="detail-label">Report Reason:</span>
                      <span className="detail-value">{job.report_reason}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default JobHistory

