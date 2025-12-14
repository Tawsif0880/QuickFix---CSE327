import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <button className="icon-button" onClick={() => navigate('/settings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <button className="icon-button" onClick={() => navigate('/profile')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </button>
      </div>

      {/* Messages Icon */}
      <div className="messages-section">
        <button className="messages-button" onClick={() => navigate('/messages')}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <span className="notification-badge">1</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* First Row - Job Board and Appointed Job */}
        <div className="cards-row">
          <div className="dashboard-card job-board-card" onClick={() => navigate('/job-board')}>
            <h3 className="card-title">Job Board (NearBy Location)</h3>
          </div>

          <div className="dashboard-card appointed-card" onClick={() => navigate('/appointed-jobs')}>
            <h3 className="card-title">Appointed Job</h3>
          </div>
        </div>

        {/* Accepted Job Request Card */}
        <div className="dashboard-card accepted-card" onClick={() => navigate('/accepted-jobs')}>
          <h3 className="card-title">Accepted Job Request</h3>
        </div>

        {/* Upcoming Jobs Section */}
        <div className="upcoming-jobs-section">
          <h3 className="section-title">Upcoming Jobs:</h3>
          <div className="job-slot-card">
            <p className="slot-text">slot</p>
          </div>
        </div>

        {/* Pay Your Due Card */}
        <div className="dashboard-card payment-card" onClick={() => navigate('/payment')}>
          <h3 className="card-title">Pay Your Due</h3>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/call-customer')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
          <span>Call Customer</span>
        </button>
        
        <button className="nav-item" onClick={() => navigate('/saved-jobs')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
          <span>Saved Jobs</span>
        </button>
        
        <button className="nav-item" onClick={() => navigate('/updates')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          <span>Updates</span>
        </button>
      </div>
    </div>
  )
}

export default Dashboard

