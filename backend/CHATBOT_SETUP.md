# Gemini AI Chatbot Integration Guide

## Overview
The QuickFix platform now includes an AI-powered chatbot feature integrated with Google's Gemini API. This allows customers to get instant help and information through the customer dashboard.

## Features
- ✅ Real-time AI chat assistance
- ✅ Multiple conversation contexts (general, service, booking, support)
- ✅ Chat session management
- ✅ Conversation history persistence
- ✅ Responsive UI with modern design
- ✅ Error handling and service availability checks

## Setup Instructions

### 1. Get Gemini API Key

1. **Go to Google AI Studio:**
   - Visit https://makersuite.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated API key

2. **Or use Google Cloud Console:**
   - Go to https://console.cloud.google.com/
   - Create a new project
   - Enable the "Generative Language API"
   - Create an API key from the credentials page

### 2. Backend Configuration

1. **Set Environment Variable**
   
   Create or update a `.env` file in the backend directory:
   ```bash
   # .env file
   GEMINI_API_KEY=your_api_key_here
   ```

   Or set it as a system environment variable:
   
   **Windows (PowerShell):**
   ```powershell
   $env:GEMINI_API_KEY="your_api_key_here"
   ```

   **Windows (Command Prompt):**
   ```cmd
   set GEMINI_API_KEY=your_api_key_here
   ```

   **Linux/Mac:**
   ```bash
   export GEMINI_API_KEY=your_api_key_here
   ```

2. **Dependencies are already installed**
   - `google-generativeai==0.3.0` has been added to requirements.txt
   - Run `pip install -r requirements.txt` to ensure it's installed

### 3. Database Migration

The chatbot creates new tables automatically:
- `chat_sessions` - Stores chat conversation sessions
- `chat_messages` - Stores individual messages within sessions

These tables are created automatically when the app starts.

### 4. Start the Services

**Backend (if not already running):**
```bash
cd backend
python run.py
```

The backend should be running on `http://localhost:5000`

**Frontend (Customer PWA - if not already running):**
```bash
cd customer-pwa
npm run dev
```

The frontend will be running on `http://localhost:3000`

## API Endpoints

### Check Chatbot Service Status
```
GET /api/bot/health
```
Returns status of chatbot service.

### Get All Chat Sessions
```
GET /api/bot/sessions
```
Returns all active chat sessions for the authenticated user.

### Create New Chat Session
```
POST /api/bot/sessions
Content-Type: application/json

{
  "context_type": "general",  // optional: 'general', 'service', 'booking', 'support'
  "title": "My Chat"          // optional
}
```

### Send Message in Session
```
POST /api/bot/sessions/{session_id}/message
Content-Type: application/json

{
  "message": "What services are available?"
}
```

Response:
```json
{
  "success": true,
  "user_message": "What services are available?",
  "ai_response": "We offer various services including plumbing, electrical work...",
  "session": { ... }
}
```

### Get Session Details
```
GET /api/bot/sessions/{session_id}
```

### Delete Session
```
DELETE /api/bot/sessions/{session_id}
```

### Get Quick Response (without session)
```
POST /api/bot/quick-response
Content-Type: application/json

{
  "prompt": "Your question here"
}
```

### Get Available Contexts
```
GET /api/bot/context-info
```

## Frontend Usage

### ChatAI Component Location
- File: `customer-pwa/src/pages/ChatAI.jsx`
- CSS: `customer-pwa/src/pages/ChatAI.css`

### Accessing the Chat
1. Login to the customer dashboard
2. Click "Chat With AI Assistant" button
3. Select a context type (general, service, booking, support)
4. Click "Start Chat"
5. Type messages and get instant AI responses

### Chat Service Functions
The `chatService` (in `customer-pwa/src/services/chatService.js`) provides:

```javascript
// Check service availability
await chatService.checkHealth()

// Get all sessions
const sessions = await chatService.getSessions()

// Create new session
const session = await chatService.createSession('general', 'My Chat')

// Send message
const response = await chatService.sendMessage(sessionId, 'Your message')

// Get specific session
const session = await chatService.getSession(sessionId)

// Delete session
await chatService.deleteSession(sessionId)

// Get context info
const contexts = await chatService.getContextInfo()
```

## Context Types

| Context | Use Case |
|---------|----------|
| **general** | General questions and assistance |
| **service** | Service information and recommendations |
| **booking** | Help with booking and scheduling |
| **support** | Customer support and troubleshooting |

## Troubleshooting

### "Chatbot service is not available"
- **Check:** Ensure `GEMINI_API_KEY` environment variable is set
- **Check:** Restart the backend server
- **Check:** Verify API key is valid in Google AI Studio
- **Check:** Ensure network connectivity to Google's API

### "Failed to send message"
- **Check:** Internet connection
- **Check:** API quota limits (check Google AI Studio dashboard)
- **Check:** Message length (try shorter messages)

### Chat not saving
- **Check:** Database connectivity
- **Check:** User is authenticated (JWT token valid)
- **Check:** Database has necessary tables (they should be auto-created)

## Features Breakdown

### Message Flow
1. User types message in ChatAI component
2. Message sent to `/api/bot/sessions/{id}/message` endpoint
3. Backend receives message and sends to Gemini API
4. Gemini returns AI response
5. Response saved to database with message
6. Response sent back to frontend
7. UI updated with AI response

### Session Management
- Each chat session stores conversation history
- Sessions persist across browser sessions
- Users can view, continue, or delete previous chats
- Chat history included in session details

### Database Schema

**chat_sessions table:**
```
- id (Integer, Primary Key)
- user_id (Integer, Foreign Key)
- title (String)
- context_type (String)
- messages (JSON) - Stores conversation history
- is_active (Boolean)
- created_at (DateTime)
- updated_at (DateTime)
```

**chat_messages table:**
```
- id (Integer, Primary Key)
- session_id (Integer, Foreign Key)
- sender_type (String) - 'user' or 'assistant'
- content (Text)
- response (Text)
- tokens_used (Integer)
- created_at (DateTime)
```

## Performance Considerations

- Chat sessions are cached in memory (`_active_chats` dict)
- Messages are stored as JSON for quick retrieval
- Consider implementing pagination for long conversation histories
- API rate limits apply (check Google's quotas)

## Security

- ✅ JWT authentication required for all endpoints
- ✅ User can only access their own sessions
- ✅ API key stored in environment variables (not in code)
- ✅ Input validation on message content

## Future Enhancements

- [ ] Voice chat integration
- [ ] Real-time typing indicators
- [ ] Chat export/download
- [ ] Advanced search within chat history
- [ ] Integration with specific service providers
- [ ] Analytics dashboard for chat usage
- [ ] Multi-language support
- [ ] Custom system prompts per user type

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API logs in backend console
3. Check browser console for frontend errors
4. Verify Gemini API status at https://status.cloud.google.com/

## Additional Resources

- [Google Generative AI Python SDK](https://github.com/google/generative-ai-python)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [QuickFix Backend Documentation](../README.md)
