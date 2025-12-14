import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, Button } from '../components'
import { adminService } from '../services/adminService'
import { useAuth } from '../context/AuthContext'
import './Chats.css'

const Chats = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [conversationId, setConversationId] = useState('')

  useEffect(() => {
    loadChats()
  }, [currentPage, conversationId])

  const loadChats = async () => {
    try {
      setLoading(true)
      const data = await adminService.getChats(
        currentPage, 
        50, 
        conversationId ? parseInt(conversationId) : null
      )
      setMessages(data.messages || [])
      setTotalPages(data.pages || 1)
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chats-container">
      <div className="chats-header">
        <Logo showEst={false} size="small" />
        <div className="header-actions">
          <span className="admin-name">Admin: {user?.email}</span>
          <Button onClick={() => { logout(); navigate('/signin') }} variant="secondary" className="btn-small">
            Logout
          </Button>
        </div>
      </div>

      <nav className="dashboard-nav">
        <button className="nav-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
        <button className="nav-btn" onClick={() => navigate('/users')}>Users</button>
        <button className="nav-btn" onClick={() => navigate('/providers')}>Providers</button>
        <button className="nav-btn" onClick={() => navigate('/jobs')}>Jobs</button>
        <button className="nav-btn active" onClick={() => navigate('/chats')}>Chat Logs</button>
      </nav>

      <div className="chats-content">
        <div className="page-header">
          <h1 className="page-title">Chat Logs</h1>
          <div className="filters">
            <input
              type="number"
              className="filter-input"
              placeholder="Conversation ID (optional)"
              value={conversationId}
              onChange={(e) => { setConversationId(e.target.value); setCurrentPage(1); }}
            />
            <Button
              variant="secondary"
              className="btn-small"
              onClick={loadChats}
            >
              Filter
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading chat logs...</div>
        ) : (
          <>
            <div className="table-container">
              <table className="chats-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Conversation ID</th>
                    <th>Sender</th>
                    <th>Message</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">No messages found</td>
                    </tr>
                  ) : (
                    messages.map((message) => (
                      <tr key={message.id}>
                        <td>{message.id}</td>
                        <td>{message.conversation_id}</td>
                        <td>
                          <div className="sender-info">
                            <span className="sender-name">{message.sender_name || 'N/A'}</span>
                            <span className="sender-role">{message.sender_role || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="message-cell">
                          <div className="message-content">{message.content || 'N/A'}</div>
                        </td>
                        <td>{new Date(message.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <Button
                  variant="secondary"
                  className="btn-small"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="page-info">Page {currentPage} of {totalPages}</span>
                <Button
                  variant="secondary"
                  className="btn-small"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Chats

