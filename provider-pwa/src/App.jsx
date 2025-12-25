import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components'

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

function App() {
  return (
    <AuthProvider>
      <Router>
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
          <Route path="/appointed-jobs" element={<ProtectedRoute><div>Appointed Jobs Page</div></ProtectedRoute>} />
          <Route
            path="/accepted-jobs"
            element={
              <ProtectedRoute>
                <AcceptedJobs />
              </ProtectedRoute>
            }
          />
          <Route path="/payment" element={<ProtectedRoute><div>Payment Page</div></ProtectedRoute>} />
          <Route path="/call-customer" element={<ProtectedRoute><div>Call Customer Page</div></ProtectedRoute>} />
          <Route path="/updates" element={<ProtectedRoute><div>Updates Page</div></ProtectedRoute>} />
          <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

