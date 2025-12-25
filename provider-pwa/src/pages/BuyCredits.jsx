import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo, Button } from '../components'
import { providerService } from '../services/providerService'
import './BuyCredits.css'

const CREDIT_PACKAGES = [
  { amount: 100, label: '100 Credits' },
  { amount: 300, label: '300 Credits' },
  { amount: 500, label: '500 Credits' }
]

const BuyCredits = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('bank')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [currentCredits, setCurrentCredits] = useState(user?.profile?.credits || 20)

  useEffect(() => {
    // Fetch current credit balance
    const fetchBalance = async () => {
      try {
        const profile = await providerService.getProfile()
        setCurrentCredits(profile.credits || 20)
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

    if (paymentMethod !== 'bank') {
      setMessage({ type: 'error', text: 'Only Bank payment is currently supported' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const result = await providerService.purchaseCredits(selectedPackage.amount, paymentMethod)
      
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
          <span className="current-credits-amount">{currentCredits.toFixed(2)}</span>
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
      <form onSubmit={handlePurchase} className="buy-credits-form">
        <div className="credit-packages">
          <h2 className="packages-title">Select Credit Package</h2>
          <div className="packages-grid">
            {CREDIT_PACKAGES.map(pkg => (
              <button
                key={pkg.amount}
                type="button"
                className={`package-card ${selectedPackage?.amount === pkg.amount ? 'selected' : ''}`}
                onClick={() => setSelectedPackage(pkg)}
              >
                <div className="package-amount">{pkg.amount}</div>
                <div className="package-label">{pkg.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="payment-method-section">
          <h2 className="payment-title">Payment Method</h2>
          <div className="payment-options">
            <label className="payment-option">
              <input
                type="radio"
                name="payment_method"
                value="bank"
                checked={paymentMethod === 'bank'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span className="payment-label">Bank Transfer (Fake)</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          className="purchase-button"
          disabled={!selectedPackage || loading}
        >
          {loading ? 'Processing...' : 'Purchase Credits'}
        </Button>
      </form>
    </div>
  )
}

export default BuyCredits
