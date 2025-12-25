import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components'
import InstallPrompt from './components/InstallPrompt'

// Pages
import Welcome from './pages/Welcome'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import JobBoard from './pages/JobBoard'
import SavedJobs from './pages/SavedJobs'
import AcceptedJobs from './pages/AcceptedJobs'
import RequestedJobs from './pages/RequestedJobs'
import UpcomingCalls from './pages/UpcomingCalls'
import CustomerProfile from './pages/CustomerProfile'
import EmergencyRequests from './pages/EmergencyRequests'
import EmergencyJobs from './pages/EmergencyJobs'
import BuyCredits from './pages/BuyCredits'
import JobHistory from './pages/JobHistory'

function App() {
  return (
    <AuthProvider>
      <Router>
        <InstallPrompt />
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/chat/:conversationId"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          
          {/* Placeholder routes for other pages */}
          <Route
            path="/job-board"
            element={
              <ProtectedRoute>
                <JobBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved-jobs"
            element={
              <ProtectedRoute>
                <SavedJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requested-jobs"
            element={
              <ProtectedRoute>
                <RequestedJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accepted-jobs"
            element={
              <ProtectedRoute>
                <AcceptedJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upcoming-calls"
            element={
              <ProtectedRoute>
                <UpcomingCalls />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-profile/:customerId"
            element={
              <ProtectedRoute>
                <CustomerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency-requests"
            element={
              <ProtectedRoute>
                <EmergencyRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency-jobs"
            element={
              <ProtectedRoute>
                <EmergencyJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buy-credits"
            element={
              <ProtectedRoute>
                <BuyCredits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-history"
            element={
              <ProtectedRoute>
                <JobHistory />
              </ProtectedRoute>
            }
          />
          <Route path="/updates" element={<ProtectedRoute><div>Updates Page</div></ProtectedRoute>} />
          <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

