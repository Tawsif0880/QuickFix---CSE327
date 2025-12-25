import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button } from '../components'
import { bookingService } from '../services/bookingService'
import './Orders.css'

const Orders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError('')
      const status = statusFilter === 'all' ? null : statusFilter
      const response = await bookingService.getMyBookings(status)
      setOrders(response.bookings || [])
    } catch (err) {
      console.error('Error loading orders:', err)
      setError(err.response?.data?.error || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'status-confirmed'
      case 'in_progress':
        return 'status-in-progress'
      case 'completed':
        return 'status-completed'
      case 'cancelled':
        return 'status-cancelled'
      case 'pending':
        return 'status-pending'
      default:
        return 'status-default'
    }
  }

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'Confirmed'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      case 'pending':
        return 'Pending'
      default:
        return status || 'Unknown'
    }
  }

  return (
    <div className="orders-container">
      {/* Top Bar */}
      <div className="orders-topbar">
        <button className="icon-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <button className="icon-button" onClick={loadOrders}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="orders-content">
        <h1 className="orders-title">My Orders</h1>
        <p className="orders-subtitle">View all your service orders</p>

        {/* Status Filter */}
        <div className="status-filters">
          <button
            className={`filter-button ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-button ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`filter-button ${statusFilter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('confirmed')}
          >
            Confirmed
          </button>
          <button
            className={`filter-button ${statusFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setStatusFilter('in_progress')}
          >
            In Progress
          </button>
          <button
            className={`filter-button ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found</p>
            <Button
              variant="secondary"
              onClick={() => navigate('/book-service')}
              style={{ marginTop: '16px' }}
            >
              Book a Service
            </Button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div className="order-id">Order #{order.id}</div>
                  <div className={`order-status-badge ${getStatusBadgeClass(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </div>
                </div>

                {order.job && (
                  <>
                    <div className="order-category">{order.job.category}</div>
                    <h3 className="order-title">{order.job.title}</h3>
                    <p className="order-description">{order.job.description}</p>
                  </>
                )}

                <div className="order-details">
                  <div className="order-detail-item">
                    <span className="detail-label">Price:</span>
                    <span className="detail-value">${parseFloat(order.price).toFixed(2)}</span>
                  </div>

                  {order.provider && (
                    <div className="order-detail-item">
                      <span className="detail-label">Provider:</span>
                      <span className="detail-value">{order.provider.name}</span>
                    </div>
                  )}

                  {order.job && order.job.location_address && (
                    <div className="order-detail-item">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{order.job.location_address}</span>
                    </div>
                  )}

                  {order.scheduled_at && (
                    <div className="order-detail-item">
                      <span className="detail-label">Scheduled:</span>
                      <span className="detail-value">{formatDate(order.scheduled_at)}</span>
                    </div>
                  )}

                  <div className="order-detail-item">
                    <span className="detail-label">Order Date:</span>
                    <span className="detail-value">{formatDate(order.created_at)}</span>
                  </div>

                  {order.completed_at && (
                    <div className="order-detail-item">
                      <span className="detail-label">Completed:</span>
                      <span className="detail-value">{formatDate(order.completed_at)}</span>
                    </div>
                  )}
                </div>

                {order.provider && (
                  <div className="order-actions">
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/provider/${order.provider.id}`)}
                      className="view-provider-button"
                    >
                      View Provider
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders
