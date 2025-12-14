# QuickFix Admin Dashboard

Admin dashboard for managing the QuickFix service marketplace platform.

## Features

- **Dashboard Overview**: View platform statistics (users, providers, jobs, bookings)
- **User Management**: View, filter, and suspend/activate user accounts
- **Provider Management**: View providers and verify them to make them searchable
- **Job Management**: View all service requests and flag suspicious jobs
- **Chat Logs**: View all platform messages and conversations

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Access the dashboard at `http://localhost:3002`

## Usage

1. **Sign Up/In**: Create an admin account or sign in with existing credentials
2. **Dashboard**: View platform statistics and overview
3. **Users**: Manage user accounts, suspend/activate as needed
4. **Providers**: Verify providers to make them appear in customer search
5. **Jobs**: Monitor service requests and flag suspicious activity
6. **Chat Logs**: Review platform conversations for moderation

## API Configuration

The dashboard connects to the backend API at `http://localhost:5000/api` by default. This can be configured via environment variables.

## Requirements

- Node.js 16+ 
- Backend API running on port 5000
- Admin user account with `role: 'admin'`

