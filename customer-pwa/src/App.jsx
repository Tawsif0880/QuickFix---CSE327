import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components'

// Pages
import Welcome from './pages/Welcome'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Providers from './pages/Providers'
import ProviderDetail from './pages/ProviderDetail'
import Search from './pages/Search'
import RequestAccepted from './pages/RequestAccepted'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import BuyCredits from './pages/BuyCredits'
import ChatExpert from './pages/ChatExpert'
import CallExpert from './pages/CallExpert'
import Chat from './pages/Chat'
import Messages from './pages/Messages'
import BookService from './pages/BookService'
import Orders from './pages/Orders'

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
            path="/providers"
            element={
              <ProtectedRoute>
                <Providers />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/provider/:id"
            element={
              <ProtectedRoute>
                <ProviderDetail />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/request-accepted"
            element={
              <ProtectedRoute>
                <RequestAccepted />
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
            path="/buy-credits"
            element={
              <ProtectedRoute>
                <BuyCredits />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <Search />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/chat-expert"
            element={
              <ProtectedRoute>
                <ChatExpert />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/chat/:providerId"
            element={
              <ProtectedRoute>
                <Chat />
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
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route path="/location" element={<ProtectedRoute><div>Location Page</div></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><div>Notifications Page</div></ProtectedRoute>} />
          <Route path="/menu" element={<ProtectedRoute><div>Menu Page</div></ProtectedRoute>} />
          <Route
            path="/call-expert"
            element={
              <ProtectedRoute>
                <CallExpert />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book-service"
            element={
              <ProtectedRoute>
                <BookService />
              </ProtectedRoute>
            }
          />
          <Route path="/emergency" element={<ProtectedRoute><div>Emergency Page</div></ProtectedRoute>} />
          <Route path="/chat-ai" element={<ProtectedRoute><div>ChatAI Page</div></ProtectedRoute>} />
          <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

