import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button } from '../components'
import { adminService } from '../services/adminService'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await adminService.getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <Logo showEst={false} size="small" />
        <div className="header-actions">
          <span className="admin-name">Admin: {user?.email}</span>
          <Button onClick={handleLogout} variant="secondary" className="btn-small">
            Logout
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <button className="nav-btn active" onClick={() => navigate('/dashboard')}>
          Dashboard
        </button>
        <button className="nav-btn" onClick={() => navigate('/users')}>
          Users
        </button>
        <button className="nav-btn" onClick={() => navigate('/providers')}>
          Providers
        </button>
        <button className="nav-btn" onClick={() => navigate('/jobs')}>
          Jobs
        </button>
        <button className="nav-btn" onClick={() => navigate('/chats')}>
          Chat Logs
        </button>
        <button className="nav-btn" onClick={() => navigate('/statistics')}>
          Statistics
        </button>
      </nav>

      {/* Stats Cards */}
      <div className="dashboard-content">
        <h1 className="dashboard-title">Dashboard Overview</h1>
        
        {loading ? (
          <div className="loading">Loading statistics...</div>
        ) : stats ? (
          <div className="stats-grid">
            {/* Users Stats */}
            <div className="stat-card">
              <div className="stat-icon users-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 7c0-2.21-1.79-4-4-4S8 4.79 8 7s1.79 4 4 4 4-1.79 4-4zm-4 6c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="stat-info">
                <h3 className="stat-label">Total Users</h3>
                <p className="stat-value">{stats.users?.total || 0}</p>
                <div className="stat-details">
                  <span>Customers: {stats.users?.customers || 0}</span>
                  <span>Providers: {stats.users?.providers || 0}</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon providers-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="stat-info">
                <h3 className="stat-label">Verified Providers</h3>
                <p className="stat-value">{stats.users?.verified_providers || 0}</p>
                <p className="stat-subtext">Out of {stats.users?.providers || 0} total</p>
              </div>
            </div>

            {/* Jobs Stats */}
            <div className="stat-card">
              <div className="stat-icon jobs-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <div className="stat-info">
                <h3 className="stat-label">Total Jobs</h3>
                <p className="stat-value">{stats.jobs?.total || 0}</p>
                <div className="stat-details">
                  <span>Pending: {stats.jobs?.pending || 0}</span>
                  <span>Completed: {stats.jobs?.completed || 0}</span>
                </div>
              </div>
            </div>

            {/* Bookings Stats */}
            <div className="stat-card">
              <div className="stat-icon bookings-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H19V1h-2v1H7V1H5v1H3.5C2.67 2 2 2.67 2 3.5v17C2 21.33 2.67 22 3.5 22h17c.83 0 1.5-.67 1.5-1.5v-17C22 2.67 21.33 2 20.5 2zM20 20H4V9h16v11z"/>
                </svg>
              </div>
              <div className="stat-info">
                <h3 className="stat-label">Total Bookings</h3>
                <p className="stat-value">{stats.bookings?.total || 0}</p>
                <div className="stat-details">
                  <span>Active: {stats.bookings?.active || 0}</span>
                  <span>Completed: {stats.bookings?.completed || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="error-state">Failed to load statistics</div>
        )}
      </div>
    </div>
  )
}

export default Dashboard

