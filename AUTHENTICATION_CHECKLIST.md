# Authentication System - Installation Checklist

Use this checklist to ensure your authentication system is properly configured and working.

## ✅ Prerequisites

- [ ] Supabase project created at [supabase.com](https://supabase.com)
- [ ] Backend repository cloned
- [ ] Frontend repository cloned
- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed

---

## 🔧 Backend Configuration

### Environment Variables

- [ ] Created `automation-chatbot-backend/.env` file
- [ ] Added `SUPABASE_URL` (format: `https://xxxxx.supabase.co`)
- [ ] Added `SUPABASE_KEY` (service role key, starts with `eyJ...`)
- [ ] Verified Supabase URL is correct
- [ ] Verified Supabase key is correct

**Sample `.env`:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGc...your-service-role-key
```

### Dependencies

- [ ] Activated virtual environment (`source venv/bin/activate` or `venv\Scripts\activate`)
- [ ] Installed requirements (`pip install -r requirements.txt`)
- [ ] No installation errors

### Files Created

- [ ] `app/core/auth.py` exists
- [ ] `app/api/routes/auth.py` exists
- [ ] `app/api/routes/workflow.py` updated
- [ ] `app/models/database.py` updated
- [ ] `app/main.py` includes auth routes

### Backend Startup

- [ ] Backend starts without errors
- [ ] Can access `http://localhost:8000`
- [ ] Can access `http://localhost:8000/health`
- [ ] Can access `http://localhost:8000/docs` (Swagger UI)
- [ ] See `/api/auth/me` endpoint in docs

---

## 🎨 Frontend Configuration

### Environment Variables

- [ ] Created `automation-chatbot-frontend/.env` file
- [ ] Added `VITE_API_BASE_URL=http://localhost:8000`
- [ ] Added `VITE_SUPABASE_URL` (same as backend)
- [ ] Added `VITE_SUPABASE_ANON_KEY` (NOT service role key!)
- [ ] Verified using anon key (starts with `eyJ...` but different from service key)

**Sample `.env`:**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
```

### Dependencies

- [ ] Ran `npm install` in `automation-chatbot-frontend/`
- [ ] `@supabase/supabase-js` installed (check `package.json`)
- [ ] No installation errors

### Files Created

- [ ] `src/contexts/AuthContext.tsx` exists
- [ ] `src/pages/Login.tsx` exists
- [ ] `src/pages/Signup.tsx` exists
- [ ] `src/components/Auth/ProtectedRoute.tsx` exists
- [ ] `src/App.tsx` updated with AuthProvider
- [ ] `src/services/api.ts` updated with interceptors

### Frontend Startup

- [ ] Frontend starts without errors (`npm run dev`)
- [ ] Can access `http://localhost:5173`
- [ ] No console errors on page load
- [ ] Redirected to `/login` page

---

## 🔐 Supabase Configuration

### Authentication Settings

- [ ] Logged into [Supabase Dashboard](https://app.supabase.com)
- [ ] Selected correct project
- [ ] **Authentication → Providers**: Email enabled
- [ ] **Authentication → URL Configuration**: Site URL set to `http://localhost:5173`
- [ ] **Authentication → URL Configuration**: Redirect URLs include `http://localhost:5173/**`

### Database Schema

- [ ] `workflows` table exists
- [ ] `workflows` table has `created_by` column (UUID, references auth.users)
- [ ] Row Level Security (RLS) configured (optional)

**Check in SQL Editor:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workflows' AND column_name = 'created_by';
```

---

## 🧪 Functional Testing

### Account Creation

- [ ] Navigate to `http://localhost:5173`
- [ ] Redirected to `/login` page
- [ ] Click "create a new account"
- [ ] Enter email address
- [ ] Enter password (min 6 characters)
- [ ] Confirm password matches
- [ ] Accept terms of service
- [ ] Click "Create account"
- [ ] Success message displayed
- [ ] Redirected to login page (or email verification page)

### Sign In

- [ ] Navigate to `/login`
- [ ] Enter email address
- [ ] Enter password
- [ ] Click "Sign in"
- [ ] Success message displayed
- [ ] Redirected to home page (`/`)
- [ ] No infinite redirect loop

### Protected Routes

- [ ] After login, can access home page (`/`)
- [ ] After login, can access test page (`/test`)
- [ ] Sign out (if button exists) redirects to `/login`
- [ ] Opening new tab while signed in keeps you signed in
- [ ] After signing out, accessing `/` redirects to `/login`

### API Authentication

- [ ] Open browser DevTools → Network tab
- [ ] Make an API request (create workflow, etc.)
- [ ] Request headers include `Authorization: Bearer ...`
- [ ] Request succeeds (status 200)
- [ ] Request without token fails (status 401)

**Test in console:**
```javascript
// Get current session
const { data } = await window.supabase.auth.getSession();
console.log('User:', data.session?.user);
console.log('Token:', data.session?.access_token);
```

### Workflow Creation

- [ ] Create a new workflow
- [ ] Workflow saves successfully
- [ ] Workflow appears in workflow list
- [ ] Other users don't see your workflows (test with second account)

### Free Tier Limits

- [ ] Create 5 workflows
- [ ] Attempt to create 6th workflow
- [ ] Get error: "Free tier limit reached"
- [ ] Error message suggests upgrading to Pro

---

## 🔍 Verification Commands

### Check Backend Auth Endpoint

```bash
# Should return 401 Unauthorized
curl http://localhost:8000/api/auth/me

# With valid token (get from browser DevTools)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:8000/api/auth/me
# Should return user profile
```

### Check Frontend Build

```bash
cd automation-chatbot-frontend
npm run build
# Should complete without errors
```

### Check Database Connection

```bash
cd automation-chatbot-backend
python -c "from app.services.supabase_client import get_supabase_client; client = get_supabase_client(); print('✅ Connected to Supabase')"
```

---

## 🚨 Troubleshooting

### ❌ "Not authenticated" on all requests

**Check:**
- [ ] Frontend `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Restarted frontend after changing `.env`
- [ ] User is actually signed in: `await supabase.auth.getSession()`
- [ ] Token is being sent in headers (check Network tab)

### ❌ "Invalid authentication credentials"

**Check:**
- [ ] Backend `.env` has correct `SUPABASE_URL` and `SUPABASE_KEY`
- [ ] Using service role key in backend, anon key in frontend
- [ ] Supabase project is active (not paused)
- [ ] Keys match the same Supabase project

### ❌ CORS errors

**Check:**
- [ ] Backend `app/main.py` CORS settings include `http://localhost:5173`
- [ ] Both frontend and backend are running
- [ ] Using correct ports (8000 for backend, 5173 for frontend)

### ❌ Redirect loop on login

**Check:**
- [ ] `/login` and `/signup` routes NOT wrapped in `ProtectedRoute`
- [ ] `AuthContext` properly exports `useAuth` hook
- [ ] `user` state updates correctly after login

### ❌ Can't create workflows

**Check:**
- [ ] User is authenticated (check console)
- [ ] `created_by` column exists in `workflows` table
- [ ] Backend logs for specific error

---

## 📊 Success Criteria

### Minimum Requirements

- ✅ Backend starts without errors
- ✅ Frontend starts without errors
- ✅ Can create account
- ✅ Can sign in
- ✅ Protected routes redirect to login
- ✅ Can access home page after login
- ✅ API requests include auth token
- ✅ Can create workflows (saved with user ID)

### Full Functionality

- ✅ All minimum requirements
- ✅ Can sign out
- ✅ Free tier limit enforced (5 workflows)
- ✅ Only see own workflows
- ✅ Session persists across page refreshes
- ✅ Automatic redirect on 401 errors
- ✅ Clean error messages
- ✅ Loading states work correctly

---

## 📝 Post-Installation Tasks

### Optional Enhancements

- [ ] Configure email verification in Supabase
- [ ] Customize email templates
- [ ] Add password reset page
- [ ] Add OAuth providers (Google, GitHub)
- [ ] Add user profile page
- [ ] Implement subscription upgrade flow
- [ ] Add admin dashboard

### Production Checklist

- [ ] Update frontend `.env` with production URLs
- [ ] Update Supabase URL Configuration with production URLs
- [ ] Enable RLS on `workflows` table
- [ ] Set up monitoring/logging
- [ ] Configure rate limiting
- [ ] Add security headers
- [ ] Test with real users
- [ ] Set up backup strategy

---

## 🎉 Completion

Once all checkboxes are marked, your authentication system is fully functional!

**Next Steps:**
1. Read [AUTHENTICATION_SYSTEM_GUIDE.md](./AUTHENTICATION_SYSTEM_GUIDE.md) for advanced features
2. Explore customization options
3. Deploy to production (see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md))

---

**Questions?** See the troubleshooting section in [AUTHENTICATION_SYSTEM_GUIDE.md](./AUTHENTICATION_SYSTEM_GUIDE.md)

**Found a bug?** Check the [GitHub Issues](https://github.com/your-repo/issues) or create a new one.


