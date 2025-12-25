import React from 'react'
import './Logo.css'

const Logo = ({ showEst = true, size = 'large' }) => {
  return (
    <div className={`logo-container logo-${size}`}>
      <div className="logo-icon">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="var(--accent-gold)" strokeWidth="2" fill="none"/>
          <text x="50" y="65" fontSize="60" fill="var(--accent-gold)" textAnchor="middle" fontFamily="serif" fontWeight="bold">Q</text>
          <text x="50" y="50" fontSize="40" fill="var(--accent-gold)" textAnchor="middle" fontFamily="serif" fontWeight="bold">F</text>
          <line x1="50" y1="30" x2="50" y2="70" stroke="var(--accent-gold)" strokeWidth="3"/>
          <line x1="45" y1="35" x2="55" y2="35" stroke="var(--accent-gold)" strokeWidth="2"/>
          <line x1="45" y1="65" x2="55" y2="65" stroke="var(--accent-gold)" strokeWidth="2"/>
        </svg>
      </div>
      <div className="logo-text">
        <h1 className="logo-title">QUICKFIX</h1>
        {showEst && <p className="logo-est">EST. 2025</p>}
      </div>
    </div>
  )
}

export default Logo

