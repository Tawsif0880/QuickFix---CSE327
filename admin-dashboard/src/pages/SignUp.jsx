import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Logo, Button, Input } from '../components'
import { useAuth } from '../context/AuthContext'
import './SignUp.css'

const SignUp = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    reTypePassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      })
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.reTypePassword) {
      newErrors.reTypePassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      })
      navigate('/dashboard')
    } catch (err) {
      setErrors({
        general: err.response?.data?.error || 'Registration failed. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-container">
      <div className="signup-content">
        <Logo showEst={true} size="medium" />
        
        <form onSubmit={handleSubmit} className="signup-form">
          <Input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />
          
          <Input
            type="email"
            name="email"
            placeholder="Enter Your Email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
          
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
          
          <Input
            type="password"
            name="reTypePassword"
            placeholder="Re-Type Password"
            value={formData.reTypePassword}
            onChange={handleChange}
            error={errors.reTypePassword}
            required
          />
          
          {errors.general && (
            <div className="error-message">{errors.general}</div>
          )}
          
          <Button 
            type="submit"
            variant="primary"
            fullWidth
            disabled={loading}
          >
            Admin Sign UP
          </Button>
        </form>
        
        <div className="signup-footer">
          <Link to="/signin" className="link-text">Already have an account? Sign In</Link>
        </div>
      </div>
    </div>
  )
}

export default SignUp

