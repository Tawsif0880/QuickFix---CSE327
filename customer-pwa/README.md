# QuickFix Customer PWA

Customer-facing Progressive Web Application for QuickFix service marketplace.

## Features

- **Landing Page** - Welcome screen with Sign In/Sign Up options
- **Authentication** - Sign In and Sign Up pages
- **Dashboard** - Main customer interface with service options
- **Service Providers** - Browse and find service providers
- **Request Management** - View accepted requests and bookings

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file (already created with default values):
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. The app will run on `http://localhost:3000`

## Design System

- **Primary Color**: #23103c (Dark Purple)
- **Accent Color**: #D4C08E (Gold/Beige)
- **Input Background**: #E8D5B7 (Light Brown)
- **Text Colors**: Gold for accents, White for primary text

## Project Structure

```
customer-pwa/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   ├── context/        # React Context (Auth)
│   ├── styles/         # Global styles
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── public/             # Static assets
├── package.json
└── vite.config.js
```

## Pages Implemented

1. **Welcome** (`/`) - Landing page
2. **Sign In** (`/signin`) - Login page
3. **Sign Up** (`/signup`) - Registration page
4. **Dashboard** (`/dashboard`) - Main dashboard
5. **Providers** (`/providers`) - Service provider list
6. **Request Accepted** (`/request-accepted`) - Confirmation page

## Components

- **Logo** - QuickFix logo component
- **Button** - Reusable button with variants
- **Input** - Form input component
- **ProtectedRoute** - Route guard for authenticated pages

## API Integration

The app connects to the backend API at `http://localhost:5000/api` (configurable via `.env`).

### Services

- `authService` - Authentication (login, register, logout)
- `providerService` - Provider search and details

## Development

- Uses Vite for fast development
- React Router for navigation
- Axios for API calls
- Context API for state management

## Build

To build for production:

```bash
npm run build
```

The built files will be in the `dist/` directory.

