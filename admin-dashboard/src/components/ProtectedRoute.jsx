import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, requireAdmin = true }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      color: 'var(--accent-gold)'
    }}>Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/signin" replace />
  }

  return children
}

export default ProtectedRoute

