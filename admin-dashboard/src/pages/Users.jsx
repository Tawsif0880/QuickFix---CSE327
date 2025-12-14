import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button } from '../components'
import { adminService } from '../services/adminService'
import { useAuth } from '../context/AuthContext'
import './Users.css'

const Users = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    loadUsers()
  }, [currentPage, roleFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await adminService.getUsers(currentPage, 20, roleFilter || null)
      setUsers(data.users || [])
      setTotalPages(data.pages || 1)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async (userId, suspend) => {
    try {
      setActionLoading({ ...actionLoading, [userId]: true })
      await adminService.suspendUser(userId, suspend)
      await loadUsers()
    } catch (error) {
      console.error('Error suspending user:', error)
      alert('Failed to update user status')
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false })
    }
  }

  return (
    <div className="users-container">
      <div className="users-header">
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
        <button className="nav-btn active" onClick={() => navigate('/users')}>Users</button>
        <button className="nav-btn" onClick={() => navigate('/providers')}>Providers</button>
        <button className="nav-btn" onClick={() => navigate('/jobs')}>Jobs</button>
        <button className="nav-btn" onClick={() => navigate('/chats')}>Chat Logs</button>
      </nav>

      <div className="users-content">
        <div className="page-header">
          <h1 className="page-title">User Management</h1>
          <div className="filters">
            <select 
              className="filter-select"
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Roles</option>
              <option value="customer">Customers</option>
              <option value="provider">Providers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <>
            <div className="table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-state">No users found</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge role-${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{user.profile?.name || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${user.is_active ? 'active' : 'suspended'}`}>
                            {user.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            {user.role !== 'admin' && (
                              <Button
                                variant={user.is_active ? 'danger' : 'success'}
                                className="btn-small"
                                onClick={() => handleSuspend(user.id, user.is_active)}
                                disabled={actionLoading[user.id]}
                              >
                                {user.is_active ? 'Suspend' : 'Activate'}
                              </Button>
                            )}
                          </div>
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
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
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

export default Users

