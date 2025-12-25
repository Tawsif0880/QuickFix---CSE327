import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button } from '../components'
import { adminService } from '../services/adminService'
import { useAuth } from '../context/AuthContext'
import './Providers.css'

const Providers = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    loadProviders()
  }, [currentPage])

  const loadProviders = async () => {
    try {
      setLoading(true)
      const data = await adminService.getUsers(currentPage, 20, 'provider')
      setUsers(data.users || [])
      setTotalPages(data.pages || 1)
    } catch (error) {
      console.error('Error loading providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (providerId) => {
    try {
      setActionLoading({ ...actionLoading, [providerId]: true })
      await adminService.verifyProvider(providerId)
      await loadProviders()
    } catch (error) {
      console.error('Error verifying provider:', error)
      alert('Failed to verify provider')
    } finally {
      setActionLoading({ ...actionLoading, [providerId]: false })
    }
  }

  return (
    <div className="providers-container">
      <div className="providers-header">
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
        <button className="nav-btn active" onClick={() => navigate('/providers')}>Providers</button>
        <button className="nav-btn" onClick={() => navigate('/jobs')}>Jobs</button>
        <button className="nav-btn" onClick={() => navigate('/chats')}>Chat Logs</button>
      </nav>

      <div className="providers-content">
        <h1 className="page-title">Provider Management</h1>

        {loading ? (
          <div className="loading">Loading providers...</div>
        ) : (
          <>
            <div className="table-container">
              <table className="providers-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Category</th>
                    <th>Hourly Rate</th>
                    <th>Rating</th>
                    <th>Verified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-state">No providers found</td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const provider = user.profile
                      return (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{provider?.name || 'N/A'}</td>
                          <td>{user.email}</td>
                          <td>{provider?.category || 'N/A'}</td>
                          <td>${provider?.hourly_rate || 'N/A'}</td>
                          <td>
                            {provider?.rating_avg ? (
                              <span className="rating">
                                ★ {provider.rating_avg.toFixed(1)} ({provider.rating_count || 0})
                              </span>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${provider?.verified ? 'verified' : 'unverified'}`}>
                              {provider?.verified ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td>
                            {!provider?.verified && (
                              <Button
                                variant="success"
                                className="btn-small"
                                onClick={() => handleVerify(provider.id)}
                                disabled={actionLoading[provider.id]}
                              >
                                Verify
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })
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

export default Providers

