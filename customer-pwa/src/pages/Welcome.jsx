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
            Sign IN
          </Button>
          
          <Button 
            onClick={() => navigate('/signup')}
            variant="primary"
            fullWidth
          >
            Sign UP
          </Button>
        </div>
        
        <p className="welcome-tagline">
          Every Fix Tells a Story — We Perfect Yours.
        </p>
      </div>
    </div>
  )
}

export default Welcome

