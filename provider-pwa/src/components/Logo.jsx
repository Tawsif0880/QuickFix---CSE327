import React from 'react'
import './Logo.css'

const Logo = ({ showEst = true, size = 'large' }) => {
  return (
    <div className={`logo-container logo-${size}`}>
      <div className="logo-icon">
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-svg">
          <defs>
            <linearGradient id="qfGradientProvider" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4C08E" />
              <stop offset="50%" stopColor="#8b7bb8" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
            <linearGradient id="qfGradientLightProvider" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E8D9B0" />
              <stop offset="100%" stopColor="#9d8bc4" />
            </linearGradient>
            <filter id="glowProvider">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background circle with gradient */}
          <circle cx="60" cy="60" r="55" fill="url(#qfGradientProvider)" opacity="0.15" className="logo-bg-circle"/>
          <circle cx="60" cy="60" r="52" stroke="url(#qfGradientProvider)" strokeWidth="2.5" fill="none" className="logo-border-circle"/>
          
          {/* Merged QF Monogram - Q centered, F integrated */}
          <g className="logo-qf-merged">
            {/* Q's circular form - centered in the circle */}
            <path 
              d="M 30 60 Q 30 45 45 45 Q 60 45 60 60 Q 60 75 45 75 Q 40 75 35 73" 
              stroke="url(#qfGradientProvider)" 
              strokeWidth="5" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="logo-q-path"
            />
            
            {/* Shared vertical line - Q's tail merges into F's vertical, centered */}
            <line 
              x1="45" 
              y1="73" 
              x2="45" 
              y2="85" 
              stroke="url(#qfGradientProvider)" 
              strokeWidth="5" 
              strokeLinecap="round"
              className="logo-shared-vertical"
            />
            
            {/* F's top horizontal bar - extends from shared line */}
            <line 
              x1="45" 
              y1="53" 
              x2="65" 
              y2="53" 
              stroke="url(#qfGradientLightProvider)" 
              strokeWidth="5" 
              strokeLinecap="round"
              className="logo-f-top"
            />
            
            {/* F's middle horizontal bar - extends from shared line */}
            <line 
              x1="45" 
              y1="67" 
              x2="60" 
              y2="67" 
              stroke="url(#qfGradientLightProvider)" 
              strokeWidth="5" 
              strokeLinecap="round"
              className="logo-f-middle"
            />
            
            {/* Q's tail - curves elegantly from the shared vertical */}
            <path 
              d="M 45 85 Q 47 87 50 90" 
              stroke="url(#qfGradientProvider)" 
              strokeWidth="5" 
              fill="none"
              strokeLinecap="round"
              className="logo-q-tail"
            />
            
            {/* Connecting flourish - smooth transition between Q and F */}
            <path 
              d="M 60 60 Q 63 57 65 55" 
              stroke="url(#qfGradientLightProvider)" 
              strokeWidth="3.5" 
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
              className="logo-connector"
            />
          </g>
          
          {/* Decorative accent elements */}
          <circle cx="25" cy="35" r="2.5" fill="url(#qfGradientLightProvider)" opacity="0.7" className="logo-dot-1"/>
          <circle cx="95" cy="50" r="2" fill="url(#qfGradientProvider)" opacity="0.7" className="logo-dot-2"/>
          <circle cx="70" cy="85" r="1.5" fill="url(#qfGradientLightProvider)" opacity="0.6" className="logo-dot-3"/>
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

