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
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingJobId, setRatingJobId] = useState(null)
  const [ratingProviderId, setRatingProviderId] = useState(null)
  const [selectedRating, setSelectedRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [ratingLoading, setRatingLoading] = useState(false)
  const [ratingError, setRatingError] = useState('')

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Use history endpoint for completed orders to get rating status
      // Use regular endpoint for other filters
      let response
      if (statusFilter === 'completed') {
        response = await bookingService.getBookingHistory()
      } else {
        const status = statusFilter === 'all' ? null : statusFilter
        response = await bookingService.getMyBookings(status)
      }
      
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

  const canRateOrder = (order) => {
    // Can rate if:
    // 1. Booking status is completed
    // 2. Job status is COMPLETED (not REPORTED)
    // 3. No rating exists yet
    const bookingCompleted = order.status?.toLowerCase() === 'completed'
    const jobCompleted = order.job?.status?.toUpperCase() === 'COMPLETED'
    const notReported = order.job?.status?.toUpperCase() !== 'REPORTED'
    const noExistingRating = !order.has_rating
    
    return bookingCompleted && jobCompleted && notReported && noExistingRating
  }

  const openRatingModal = (jobId, providerId) => {
    setRatingJobId(jobId)
    setRatingProviderId(providerId)
    setSelectedRating(0)
    setReviewText('')
    setRatingError('')
    setShowRatingModal(true)
  }

  const handleSubmitRating = async () => {
    if (selectedRating === 0) {
      setRatingError('Please select a rating')
      return
    }
    
    try {
      setRatingLoading(true)
      setRatingError('')
      await bookingService.submitJobRating(ratingJobId, selectedRating, reviewText)
      
      // Update the order in the list to show it's been rated with the rating value
      setOrders(prev => prev.map(order => {
        if (order.job_id === ratingJobId) {
          return { 
            ...order, 
            has_rating: true, 
            can_rate: false,
            rating: { rating: selectedRating }
          }
        }
        return order
      }))
      
      setShowRatingModal(false)
      setRatingJobId(null)
      setRatingProviderId(null)
      setSelectedRating(0)
      setReviewText('')
    } catch (err) {
      console.error('Error submitting rating:', err)
      setRatingError(err.response?.data?.error || 'Failed to submit rating')
    } finally {
      setRatingLoading(false)
    }
  }

  const StarRating = ({ rating, onSelect, interactive = true }) => {
    const [hoverRating, setHoverRating] = useState(0)
    
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`star-button ${star <= (hoverRating || rating) ? 'filled' : ''}`}
            onClick={() => interactive && onSelect(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            disabled={!interactive}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
        ))}
      </div>
    )
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

                {/* Rating Status Badge */}
                {order.status?.toLowerCase() === 'completed' && (
                  <div className="rating-status">
                    {order.has_rating ? (
                      <span className="rating-badge rated">
                        <span className="rating-stars">
                          {[1, 2, 3, 4, 5].map(star => (
                            <svg 
                              key={star} 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill={star <= (order.rating?.rating || 0) ? 'currentColor' : 'none'} 
                              stroke="currentColor" 
                              strokeWidth="2"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          ))}
                        </span>
                        <span className="rating-text">You rated {order.rating?.rating || 0} stars</span>
                      </span>
                    ) : order.job?.status?.toUpperCase() === 'REPORTED' ? (
                      <span className="rating-badge reported">Cannot Rate</span>
                    ) : (
                      <span className="rating-badge not-rated">Not Rated</span>
                    )}
                  </div>
                )}

                <div className="order-actions">
                  {order.provider && (
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/provider/${order.provider.id}`)}
                      className="view-provider-button"
                    >
                      View Provider
                    </Button>
                  )}
                  
                  {canRateOrder(order) && (
                    <Button
                      variant="primary"
                      onClick={() => openRatingModal(order.job_id, order.provider_id)}
                      className="rate-provider-button"
                    >
                      Rate Provider
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="modal-overlay" onClick={() => setShowRatingModal(false)}>
          <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Rate Your Provider</h3>
            <p className="modal-subtitle">How was your experience?</p>
            
            <div className="rating-section">
              <StarRating rating={selectedRating} onSelect={setSelectedRating} />
              <p className="rating-label">
                {selectedRating === 0 ? 'Select a rating' : 
                 selectedRating === 1 ? 'Poor' :
                 selectedRating === 2 ? 'Fair' :
                 selectedRating === 3 ? 'Good' :
                 selectedRating === 4 ? 'Very Good' :
                 'Excellent'}
              </p>
            </div>
            
            <textarea
              className="review-input"
              placeholder="Write a review (optional)..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
            />
            
            {ratingError && (
              <div className="rating-error">{ratingError}</div>
            )}
            
            <div className="modal-actions">
              <button
                className="modal-button cancel-button"
                onClick={() => setShowRatingModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-button submit-button"
                onClick={handleSubmitRating}
                disabled={ratingLoading || selectedRating === 0}
              >
                {ratingLoading ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
