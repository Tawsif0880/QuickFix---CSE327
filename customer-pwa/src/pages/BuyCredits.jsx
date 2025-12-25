import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo, Button } from '../components'
import { userService } from '../services/userService'
import './BuyCredits.css'

const CREDIT_PACKAGES = [
  { amount: 50, label: '50 Credits' },
  { amount: 100, label: '100 Credits' },
  { amount: 250, label: '250 Credits' }
]

const BuyCredits = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [currentCredits, setCurrentCredits] = useState(user?.profile?.credits || 35)

  useEffect(() => {
    // Fetch current credit balance
    const fetchBalance = async () => {
      try {
        const balance = await userService.getCreditBalance()
        setCurrentCredits(balance.credits)
      } catch (error) {
        console.error('Error fetching credit balance:', error)
      }
    }
    fetchBalance()
  }, [])

  const handlePurchase = async (e) => {
    e.preventDefault()
    
    if (!selectedPackage) {
      setMessage({ type: 'error', text: 'Please select a credit package' })
      return
    }

    if (paymentMethod !== 'bank_transfer') {
      setMessage({ type: 'error', text: 'Only Bank Transfer is currently supported' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const result = await userService.purchaseCredits(selectedPackage.amount, paymentMethod)
      setMessage({ type: 'success', text: `Successfully purchased ${result.amount_added} credits!` })
      setCurrentCredits(result.credits)
      
      // Update user context
      await updateUser()
      
      // Clear selection after successful purchase
      setTimeout(() => {
        setSelectedPackage(null)
        setMessage({ type: '', text: '' })
      }, 2000)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to purchase credits. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="buy-credits-container">
      {/* Top Bar */}
      <div className="buy-credits-topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <Logo showEst={false} size="small" />
        
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Header */}
      <div className="buy-credits-header">
        <h1 className="buy-credits-title">Buy Credits</h1>
        <div className="current-credits">
          <span className="current-credits-label">Current Balance:</span>
          <span className="current-credits-amount">{currentCredits}</span>
          <span className="current-credits-unit">credits</span>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`buy-credits-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Credit Packages */}
      <div className="buy-credits-content">
        <form onSubmit={handlePurchase} className="buy-credits-form">
          <div className="packages-section">
            <h2 className="section-title">Select Credit Package</h2>
            <div className="packages-grid">
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.amount}
                  type="button"
                  className={`package-card ${selectedPackage?.amount === pkg.amount ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedPackage(pkg)
                    setMessage({ type: '', text: '' })
                  }}
                >
                  <div className="package-amount">{pkg.amount}</div>
                  <div className="package-label">{pkg.label}</div>
                  {selectedPackage?.amount === pkg.amount && (
                    <div className="package-check">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="payment-section">
            <h2 className="section-title">Payment Method</h2>
            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'bank_transfer' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment_method"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="payment-option-content">
                  <div className="payment-option-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                  </div>
                  <div className="payment-option-details">
                    <div className="payment-option-name">Bank Transfer</div>
                    <div className="payment-option-desc">Instant credit addition</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Purchase Button */}
          <div className="purchase-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedPackage}
            >
              {loading ? 'Processing...' : `Purchase ${selectedPackage ? selectedPackage.amount : ''} Credits`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BuyCredits

