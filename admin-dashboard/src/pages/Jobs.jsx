import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button } from '../components'
import { adminService } from '../services/adminService'
import { useAuth } from '../context/AuthContext'
import './Jobs.css'

const Jobs = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    loadJobs()
  }, [currentPage, statusFilter])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const data = await adminService.getJobs(currentPage, 20, statusFilter || null)
      setJobs(data.jobs || [])
      setTotalPages(data.pages || 1)
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFlag = async (jobId) => {
    const reason = prompt('Enter reason for flagging this job:')
    if (!reason) return

    try {
      setActionLoading({ ...actionLoading, [jobId]: true })
      await adminService.flagJob(jobId, reason)
      alert('Job flagged successfully')
    } catch (error) {
      console.error('Error flagging job:', error)
      alert('Failed to flag job')
    } finally {
      setActionLoading({ ...actionLoading, [jobId]: false })
    }
  }

  return (
    <div className="jobs-container">
      <div className="jobs-header">
        <Logo showEst={false} size="small" />
        <div className="header-actions">
          <span className="admin-name">Admin: {user?.email}</span>
          <Button onClick={() => { logout(); navigate('/signin') }} variant="secondary" className="btn-small">
            Logout
          </Button>
        </div>
      </div>

      <nav className="dashboard-nav">
        <button className="nav-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
        <button className="nav-btn" onClick={() => navigate('/users')}>Users</button>
        <button className="nav-btn" onClick={() => navigate('/providers')}>Providers</button>
        <button className="nav-btn active" onClick={() => navigate('/jobs')}>Jobs</button>
        <button className="nav-btn" onClick={() => navigate('/chats')}>Chat Logs</button>
      </nav>

      <div className="jobs-content">
        <div className="page-header">
          <h1 className="page-title">Job Management</h1>
          <div className="filters">
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading jobs...</div>
        ) : (
          <>
            <div className="table-container">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Customer</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Price</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="empty-state">No jobs found</td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id}>
                        <td>{job.id}</td>
                        <td>{job.title || 'N/A'}</td>
                        <td>{job.category || 'N/A'}</td>
                        <td>{job.customer_name || 'N/A'}</td>
                        <td>{job.provider_name || 'N/A'}</td>
                        <td>
                          <span className={`status-badge status-${job.status}`}>
                            {job.status}
                          </span>
                        </td>
                        <td>${job.price || '0.00'}</td>
                        <td>{new Date(job.created_at).toLocaleDateString()}</td>
                        <td>
                          <Button
                            variant="danger"
                            className="btn-small"
                            onClick={() => handleFlag(job.id)}
                            disabled={actionLoading[job.id]}
                          >
                            Flag
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <Button
                  variant="secondary"
                  className="btn-small"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="page-info">Page {currentPage} of {totalPages}</span>
                <Button
                  variant="secondary"
                  className="btn-small"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Jobs

