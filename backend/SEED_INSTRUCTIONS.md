# Seeding Dummy Providers

This guide explains how to populate the database with dummy provider users for testing the search functionality.

## Running the Seed Script

1. **Make sure you're in the backend directory:**
   ```bash
   cd backend
   ```

2. **Activate your virtual environment (if using one):**
   ```bash
   # On Windows
   venv\Scripts\activate
   
   # On Mac/Linux
   source venv/bin/activate
   ```

3. **Run the seed script:**
   ```bash
   python seed_providers.py
   ```

## What the Script Does

The seed script creates **12 dummy provider users** with the following categories:
- Plumber (2 providers)
- Electrician (2 providers)
- Carpenter (2 providers)
- Painter (2 providers)
- Mechanic (1 provider)
- Handyman (1 provider)
- Cleaner (1 provider)
- Gardener (1 provider)

Each provider includes:
- Realistic name and contact information
- Service category
- Description
- Service area
- Hourly rate
- Sample ratings
- **Verified status** (so they appear in search results)

## Provider Login Credentials

All dummy providers use the same password for easy testing:
- **Password:** `password123`
- **Email:** See the list below

### Provider Emails:
1. john.plumber@example.com
2. sarah.electrician@example.com
3. mike.carpenter@example.com
4. lisa.painter@example.com
5. david.mechanic@example.com
6. emily.handyman@example.com
7. robert.cleaner@example.com
8. jennifer.gardener@example.com
9. james.plumber2@example.com
10. maria.electrician2@example.com
11. thomas.carpenter2@example.com
12. patricia.painter2@example.com

## Auto-Verification of New Providers

**Important:** In development mode, newly signed-up providers are **automatically verified** so they immediately appear in search results. This is configured in `app/auth/utils.py`.

In production, providers should be verified by an admin through the admin panel at `/api/admin/providers/<id>/verify`.

## Testing the Search

After running the seed script:

1. Start the backend server:
   ```bash
   python run.py
   ```

2. Start the customer PWA:
   ```bash
   cd customer-pwa
   npm run dev
   ```

3. Log in as a customer and navigate to the Search page

4. You should see all 12 providers listed

5. Try searching by:
   - Provider name (e.g., "John", "Sarah")
   - Category (e.g., "plumber", "electrician")
   - Description keywords

6. Use the Filter button to:
   - Filter by category
   - Sort by rating, price, or distance
   - Set minimum rating
   - Set maximum price

## Notes

- The script will skip providers that already exist (based on email)
- To reset and re-seed, you may need to manually delete existing providers from the database
- All providers are set as `is_available=True` by default

