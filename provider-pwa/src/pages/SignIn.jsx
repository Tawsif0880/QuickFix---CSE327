import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Logo, Button, Input } from '../components'
import { useAuth } from '../context/AuthContext'
import './SignIn.css'

const SignIn = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(formData.email, formData.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signin-container">
      <div className="signin-content">
        <Logo showEst={true} size="medium" />
        
        <form onSubmit={handleSubmit} className="signin-form">
          <Input
            type="email"
            name="email"
            placeholder="Enter Your Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          
          <Input
            type="password"
            name="password"
            placeholder="PassWord"
            value={formData.password}
            onChange={handleChange}
            required
          />
          
          {error && <div className="error-message">{error}</div>}
          
          <Button 
            type="submit"
            variant="primary"
            fullWidth
            disabled={loading}
          >
            Sign IN
          </Button>
        </form>
        
        <div className="signin-links">
          <Link to="/signup" className="link-text">Sign Up</Link>
          <Link to="/forgot-password" className="link-text">Forgot Password?</Link>
        </div>
      </div>
    </div>
  )
}

export default SignIn

