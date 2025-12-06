# Environment Setup for Frontend

## Supabase Configuration (Optional)

The frontend app can work with or without Supabase authentication.

### Option 1: Local Mode (No Supabase - Recommended for Development)

Simply don't create a `.env` file or leave the Supabase variables empty. The app will work in local mode.

### Option 2: Enable Supabase Authentication

Create a `.env` file in `automation-chatbot-frontend/` with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from your Supabase project dashboard at https://supabase.com

## Current Behavior

- **Without Supabase**: Authentication features are disabled, app works in local mode
- **With Supabase**: Full authentication with user management

## Disabling Supabase Errors

The errors you see like `net::ERR_NAME_NOT_RESOLVED` are expected when Supabase is not configured. 

The latest code changes have:
- Disabled auto-refresh tokens for placeholder client
- Changed error logs to info logs
- Made the app gracefully handle missing Supabase configuration

These errors should now be silenced in the browser console.

