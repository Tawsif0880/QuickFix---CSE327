import React, { useState, useEffect } from 'react'
import './InstallPrompt.css'

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed (running in standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsInstalled(true)
      return
    }

    // Check if user previously dismissed the prompt
    const dismissed = localStorage.getItem('installPromptDismissed')
    const dismissedTime = dismissed ? parseInt(dismissed) : 0
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    
    // If dismissed less than 7 days ago, don't show
    if (dismissed && (Date.now() - dismissedTime < sevenDays)) {
      return
    }

    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      // Show install prompt
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      console.log('PWA was installed')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Remember dismissal
    localStorage.setItem('installPromptDismissed', Date.now().toString())
  }

  // Don't show if already installed or dismissed
  if (isInstalled || !showInstallPrompt) {
    return null
  }

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <div className="install-prompt-icon">📱</div>
        <div className="install-prompt-text">
          <h3>Install QuickFix</h3>
          <p>Install this app for quick access and offline support</p>
        </div>
        <div className="install-prompt-actions">
          <button onClick={handleInstallClick} className="install-btn">
            Install
          </button>
          <button onClick={handleDismiss} className="dismiss-btn">
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstallPrompt
