import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button } from '../components'
import './Welcome.css'

const Welcome = () => {
  const navigate = useNavigate()

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <Logo showEst={true} size="large" />
        
        <div className="welcome-buttons">
          <Button 
            onClick={() => navigate('/signin')}
            variant="primary"
            fullWidth
          >
            Admin Sign IN
          </Button>
          
          <Button 
            onClick={() => navigate('/signup')}
            variant="primary"
            fullWidth
          >
            Admin Sign UP
          </Button>
        </div>
        
        <p className="welcome-tagline">
          Admin Dashboard — Manage Your Platform.
        </p>
      </div>
    </div>
  )
}

export default Welcome

