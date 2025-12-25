import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button } from '../components'
import { adminService } from '../services/adminService'
import { useAuth } from '../context/AuthContext'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import './Statistics.css'

const Statistics = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [timeFilter, setTimeFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [userGrowthData, setUserGrowthData] = useState([])
  const [serviceDemandData, setServiceDemandData] = useState([])
  const [verificationData, setVerificationData] = useState(null)

  useEffect(() => {
    loadStatistics()
  }, [timeFilter])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      
      // Load all three statistics in parallel
      const [growthResponse, demandResponse, verificationResponse] = await Promise.all([
        adminService.getUserGrowth(timeFilter),
        adminService.getServiceDemand(timeFilter),
        adminService.getProviderVerification(timeFilter)
      ])
      
      setUserGrowthData(growthResponse.data || [])
      setServiceDemandData(demandResponse.data || [])
      setVerificationData(verificationResponse)
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  const formatCategoryName = (category) => {
    if (!category) return 'Unknown'
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  // Prepare verification chart data
  const verificationChartData = verificationData ? [
    {
      name: 'Providers',
      'Verified': verificationData.verified_providers,
      'Unverified': verificationData.unverified_providers
    }
  ] : []

  return (
    <div className="statistics-container">
      {/* Header */}
      <div className="statistics-header">
        <Logo showEst={false} size="small" />
        <div className="header-actions">
          <span className="admin-name">Admin: {user?.email}</span>
          <Button onClick={handleLogout} variant="secondary" className="btn-small">
            Logout
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="statistics-nav">
        <button className="nav-btn" onClick={() => navigate('/dashboard')}>
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
        <button className="nav-btn active" onClick={() => navigate('/statistics')}>
          Statistics
        </button>
      </nav>

      {/* Content */}
      <div className="statistics-content">
        <div className="statistics-header-section">
          <h1 className="statistics-title">Platform Statistics</h1>
          
          {/* Time Filter */}
          <div className="time-filter">
            <button
              className={`filter-btn ${timeFilter === '7d' ? 'active' : ''}`}
              onClick={() => setTimeFilter('7d')}
            >
              Last 7 days
            </button>
            <button
              className={`filter-btn ${timeFilter === '30d' ? 'active' : ''}`}
              onClick={() => setTimeFilter('30d')}
            >
              Last 30 days
            </button>
            <button
              className={`filter-btn ${timeFilter === '6m' ? 'active' : ''}`}
              onClick={() => setTimeFilter('6m')}
            >
              Last 6 months
            </button>
            <button
              className={`filter-btn ${timeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTimeFilter('all')}
            >
              All time
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading statistics...</div>
        ) : (
          <div className="charts-container">
            {/* 1. User Growth Chart */}
            <div className="chart-card">
              <h2 className="chart-title">User Growth Over Time</h2>
              <p className="chart-subtitle">Track platform growth: Customers vs Providers</p>
              {userGrowthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="customer_count" 
                      stroke="#51CF66" 
                      strokeWidth={2}
                      name="Customers"
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="provider_count" 
                      stroke="#4169E1" 
                      strokeWidth={2}
                      name="Providers"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data">No data available for the selected period</div>
              )}
            </div>

            {/* 2. Service Demand Chart */}
            <div className="chart-card">
              <h2 className="chart-title">Service Demand by Category</h2>
              <p className="chart-subtitle">What services are customers requesting most?</p>
              {serviceDemandData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={serviceDemandData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tickFormatter={formatCategoryName}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [value, 'Job Requests']}
                      labelFormatter={(label) => `Category: ${formatCategoryName(label)}`}
                    />
                    <Bar dataKey="job_count" fill="#FFA726" name="Job Requests" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data">No data available for the selected period</div>
              )}
            </div>

            {/* 3. Provider Verification Funnel */}
            <div className="chart-card">
              <h2 className="chart-title">Provider Verification Status</h2>
              <p className="chart-subtitle">Platform trustworthiness: Verified vs Unverified providers</p>
              {verificationData && verificationData.total_providers > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={verificationChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Verified" stackId="a" fill="#51CF66" name="Verified" />
                      <Bar dataKey="Unverified" stackId="a" fill="#FF6B6B" name="Unverified" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="verification-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Providers:</span>
                      <span className="stat-value">{verificationData.total_providers}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Verified:</span>
                      <span className="stat-value verified">{verificationData.verified_providers}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Unverified:</span>
                      <span className="stat-value unverified">{verificationData.unverified_providers}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Verification Rate:</span>
                      <span className="stat-value">{verificationData.verification_rate}%</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-data">No provider data available</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Statistics

