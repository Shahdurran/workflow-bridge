# Authentication Quick Start Guide

Get authentication up and running in 5 minutes!

## Prerequisites

- Supabase project created (if not, see [SUPABASE_QUICK_REFERENCE.md](./SUPABASE_QUICK_REFERENCE.md))
- Backend and frontend repositories cloned

## Step 1: Configure Supabase Auth (2 minutes)

### 1.1 Enable Email Authentication

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Ensure **Email** is enabled (it should be by default)

### 1.2 Configure Auth Settings

1. Go to **Authentication** → **URL Configuration**
2. Add your site URLs:
   - **Site URL:** `http://localhost:5173` (development)
   - **Redirect URLs:** 
     - `http://localhost:5173/**`
     - Add your production URL when ready

### 1.3 Get Your Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (NOT the service_role key!)

## Step 2: Configure Backend (30 seconds)

Your backend should already have Supabase configured. Verify `automation-chatbot-backend/.env`:

```env
# Should already exist
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-SERVICE-ROLE-key
```

✅ Backend is ready! No additional changes needed.

## Step 3: Configure Frontend (1 minute)

### 3.1 Create/Update `.env` file

In `automation-chatbot-frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

⚠️ **Important:** Use the **anon key** (not service_role key) in the frontend!

### 3.2 Install Dependencies

```bash
cd automation-chatbot-frontend
npm install
```

This will install `@supabase/supabase-js` which was added to `package.json`.

## Step 4: Start the Application (1 minute)

### 4.1 Start Backend

```bash
cd automation-chatbot-backend

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Start server
python -m uvicorn app.main:app --reload --port 8000
```

### 4.2 Start Frontend

```bash
cd automation-chatbot-frontend
npm run dev
```

## Step 5: Test Authentication (1 minute)

### 5.1 Create Your First Account

1. Open browser: `http://localhost:5173`
2. You should be redirected to `/login`
3. Click "create a new account"
4. Enter email and password (min 6 characters)
5. Click "Create account"

### 5.2 Sign In

1. Enter the same credentials
2. Click "Sign in"
3. You should be redirected to the home page!

### 5.3 Verify Authentication

Open browser console and run:
```javascript
// Check if user is signed in
const { data: { session } } = await window.supabase.auth.getSession();
console.log('User:', session?.user);
```

## Verification Checklist

✅ **Backend:**
- [ ] Backend starts without errors
- [ ] Can access `http://localhost:8000/health`
- [ ] Supabase connection working

✅ **Frontend:**
- [ ] Frontend starts without errors  
- [ ] Redirected to `/login` when not authenticated
- [ ] Can create account at `/signup`
- [ ] Can sign in at `/login`
- [ ] Redirected to `/` after successful login

✅ **Authentication:**
- [ ] Can sign up with email/password
- [ ] Can sign in with credentials
- [ ] Protected routes redirect to login
- [ ] Can access home page after authentication
- [ ] API requests include Authorization header

## What's Protected?

All routes except `/login` and `/signup` require authentication:

- ✅ **Home page** (`/`) - Protected
- ✅ **Test Integration** (`/test`) - Protected  
- ✅ **All API endpoints** - Protected (except health check)

## Common Issues

### Issue: "Invalid authentication credentials"

**Solution:**
1. Check that frontend `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Verify backend `.env` has correct `SUPABASE_URL` and `SUPABASE_KEY`
3. Make sure you're using the **anon key** in frontend, **service_role key** in backend

### Issue: Stuck on login page after signing in

**Solution:**
1. Open browser console, check for errors
2. Verify auth token is being set: `await supabase.auth.getSession()`
3. Check network tab - should see Authorization header in API requests

### Issue: Can't create account

**Solution:**
1. Password must be at least 6 characters
2. Check Supabase dashboard logs: Authentication → Logs
3. Verify email provider is enabled

### Issue: CORS errors

**Solution:**
Make sure backend CORS settings include frontend URL:
```python
# In automation-chatbot-backend/app/main.py
allow_origins=["http://localhost:5173"]
```

## Next Steps

Now that authentication is working:

1. **Try creating a workflow** - should be saved with your user ID
2. **Check the free tier limit** - try creating more than 5 workflows
3. **Explore the auth system** - see [AUTHENTICATION_SYSTEM_GUIDE.md](./AUTHENTICATION_SYSTEM_GUIDE.md)

## Useful Commands

```bash
# View user in Supabase
# Go to: Dashboard → Authentication → Users

# Check backend logs
cd automation-chatbot-backend
python -m uvicorn app.main:app --reload --log-level debug

# Check if auth is working (from frontend)
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Database Check

Your workflows should now have a `created_by` column:

```sql
-- Run in Supabase SQL Editor
SELECT id, name, created_by, created_at 
FROM workflows 
ORDER BY created_at DESC 
LIMIT 10;
```

## Sign Out

To sign out (useful for testing):

```javascript
// In browser console
await window.supabase.auth.signOut();
// Or click sign out button in UI (if you add one)
```

---

## Summary

You now have:
- ✅ Working authentication with Supabase
- ✅ Protected routes and API endpoints  
- ✅ User-specific workflow management
- ✅ Free tier limits (5 workflows)
- ✅ Secure JWT token handling

**Total setup time: ~5 minutes** 🚀

For more details, see [AUTHENTICATION_SYSTEM_GUIDE.md](./AUTHENTICATION_SYSTEM_GUIDE.md)


