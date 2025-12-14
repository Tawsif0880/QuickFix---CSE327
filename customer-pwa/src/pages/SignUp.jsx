import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Logo, Button, Input } from '../components'
import { useAuth } from '../context/AuthContext'
import './SignUp.css'

const SignUp = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    birthDate: '',
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
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      })
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required'
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Birth date is required'
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
      await register(formData)
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
          <div className="name-row">
            <Input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              required
              className="name-input"
            />
            
            <Input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              required
              className="name-input"
            />
          </div>
          
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
            type="tel"
            name="contactNumber"
            placeholder="Enter Your Contact number"
            value={formData.contactNumber}
            onChange={handleChange}
            error={errors.contactNumber}
            required
          />
          
          <div className="date-input-container">
            <label className="date-label">Birth Date</label>
            <Input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              error={errors.birthDate}
              required
            />
            <span className="date-format">MM/DD/YYYY</span>
          </div>
          
          <Input
            type="password"
            name="password"
            placeholder="PassWord"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
          
          <Input
            type="password"
            name="reTypePassword"
            placeholder="Re-Type PassWord"
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
            Sign UP
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

