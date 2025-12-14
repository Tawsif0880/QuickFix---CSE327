# QuickFix - Service Marketplace Platform

A complete service marketplace platform where customers can discover providers, communicate with them, make service requests, track providers on a map, call them, and rate them.

## Architecture

- **Backend**: Flask REST API with WebSocket support (Socket.IO)
- **Customer PWA**: React app for customers to find and book services
- **Provider PWA**: React app for service providers to manage bookings and offers
- **Admin Dashboard**: React app for platform administration

## Project Structure

```
QuickFix/
├── backend/              # Flask backend API
├── customer-pwa/         # Customer React PWA
├── provider-pwa/         # Provider React PWA
└── admin-dashboard/      # Admin React Dashboard
```

## Getting Started

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Run the development server:
   ```bash
   python run.py
   ```

### Frontend Setup

Each frontend app (customer-pwa, provider-pwa, admin-dashboard) follows the same setup:

1. Navigate to the app directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file with `REACT_APP_API_URL`
4. Run development server:
   ```bash
   npm run dev
   ```

## Development

- Backend API runs on `http://localhost:5000`
- Frontend apps run on different ports (check each app's package.json)

## License

MIT

