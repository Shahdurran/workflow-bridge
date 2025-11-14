# Authentication System Implementation Guide

## Overview

This document describes the complete authentication system implemented using Supabase Auth for the Workflow Automation Bridge application.

## Table of Contents

1. [Architecture](#architecture)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Configuration](#configuration)
5. [Usage Examples](#usage-examples)
6. [Security Features](#security-features)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Architecture

### Authentication Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │         │   Supabase   │         │   Backend   │
│   (React)   │◄───────►│     Auth     │◄───────►│  (FastAPI)  │
└─────────────┘         └──────────────┘         └─────────────┘
      │                                                  │
      │ 1. Sign In/Up                                   │
      │────────────────►                                │
      │                                                  │
      │ 2. JWT Token                                    │
      │◄────────────────                                │
      │                                                  │
      │ 3. API Request (with JWT)                       │
      │─────────────────────────────────────────────────►
      │                                                  │
      │                    4. Verify Token              │
      │                    ◄────────────                │
      │                                                  │
      │ 5. Protected Resource                           │
      │◄─────────────────────────────────────────────────
```

### Key Components

**Backend:**
- `app/core/auth.py` - Authentication middleware and utilities
- `app/api/routes/auth.py` - Authentication endpoints
- Supabase Auth integration for token verification

**Frontend:**
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/components/Auth/ProtectedRoute.tsx` - Route protection
- `src/pages/Login.tsx` & `src/pages/Signup.tsx` - Auth UI
- `src/services/api.ts` - API client with auth interceptors

---

## Backend Implementation

### 1. Authentication Middleware (`app/core/auth.py`)

#### AuthUser Model
```python
class AuthUser:
    """Authenticated user model."""
    def __init__(self, user_id: str, email: str, metadata: dict = None):
        self.id = user_id
        self.email = email
        self.metadata = metadata or {}
        self.subscription_tier = metadata.get('subscription_tier', 'free')
```

#### Token Verification
```python
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> AuthUser:
    """Verify JWT token and return current user."""
    token = credentials.credentials
    response = supabase.auth.get_user(token)
    
    if not response.user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return AuthUser(
        user_id=response.user.id,
        email=response.user.email,
        metadata=response.user.user_metadata
    )
```

#### Subscription Tier Enforcement
```python
def require_subscription(min_tier: str = "free"):
    """Check if user has required subscription tier."""
    async def check_subscription(user: AuthUser = Depends(get_current_user)):
        tiers = ["free", "pro", "enterprise"]
        if user_tier_index < required_tier_index:
            raise HTTPException(status_code=403, detail="Upgrade required")
        return user
    return check_subscription
```

### 2. Authentication Routes (`app/api/routes/auth.py`)

#### Get User Profile
```python
@router.get("/me", response_model=UserProfile)
async def get_user_profile(user: AuthUser = Depends(get_current_user)):
    """Get current user profile with workflow count."""
    result = supabase.table("workflows") \
        .select("id", count="exact") \
        .eq("created_by", user.id) \
        .execute()
    
    return UserProfile(
        id=user.id,
        email=user.email,
        subscription_tier=user.subscription_tier,
        workflows_count=result.count,
        created_at=user.metadata.get('created_at', '')
    )
```

### 3. Protected Endpoints

All workflow endpoints now require authentication:

```python
@router.post("/generate")
async def generate_workflow(
    request: WorkflowGenerationRequest,
    user: AuthUser = Depends(get_current_user),  # ← Authentication required
    db: Client = Depends(get_db)
):
    # Check free tier limits
    if user.subscription_tier == 'free':
        workflows_count = db.table("workflows") \
            .select("id", count="exact") \
            .eq("created_by", user.id) \
            .execute().count
        
        if workflows_count >= 5:
            raise HTTPException(
                status_code=402,
                detail="Free tier limit reached. Upgrade to Pro."
            )
    
    # Save workflow with user ID
    workflow_data = {
        "created_by": user.id,
        # ... other fields
    }
```

### 4. Database User Filtering

Updated `list_workflows` to filter by user:

```python
async def list_workflows(
    user_id: Optional[str] = None,  # ← New parameter
    platform: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Dict[str, Any]]:
    query = client.table("workflows").select("*")
    
    if user_id:
        query = query.eq("created_by", user_id)
    
    # Apply other filters...
```

---

## Frontend Implementation

### 1. AuthContext (`src/contexts/AuthContext.tsx`)

Provides authentication state and methods throughout the app:

```typescript
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  // ... other auth methods
};
```

### 2. ProtectedRoute Component

Redirects unauthenticated users to login:

```typescript
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/login');
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? <>{children}</> : null;
};
```

### 3. Login & Signup Pages

Simple, clean authentication UI:

```typescript
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      toast({ title: 'Success!', description: 'You have been signed in.' });
      setLocation('/');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // ... render form
}
```

### 4. API Client Authentication

Automatically includes auth tokens in all requests:

```typescript
// Request interceptor - adds JWT token
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Response interceptor - handles 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 5. App Integration

Wrap app with AuthProvider and protect routes:

```typescript
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          
          <Route path="/">
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          </Route>
        </Switch>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

---

## Configuration

### Backend Environment Variables

Add to `automation-chatbot-backend/.env`:

```env
# Supabase Configuration (already configured)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-key

# These should already be set up
```

### Frontend Environment Variables

Add to `automation-chatbot-frontend/.env`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Supabase Configuration (NEW - REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

⚠️ **Important:** Use the **anon key** in the frontend, NOT the service role key!

### Supabase Setup

1. **Enable Email Authentication:**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable "Email" provider
   - Configure email templates (optional)

2. **Configure Auth Settings:**
   - Set site URL: `http://localhost:5173` (dev) or your production URL
   - Set redirect URLs for OAuth (if using)
   - Configure password requirements

3. **Create User Metadata Schema:**
   ```sql
   -- Optional: Add custom metadata fields
   ALTER TABLE auth.users 
   ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
   ```

---

## Usage Examples

### Backend: Protecting an Endpoint

```python
from app.core.auth import get_current_user, AuthUser

@router.post("/api/my-protected-route")
async def my_protected_route(
    user: AuthUser = Depends(get_current_user)
):
    """This endpoint requires authentication."""
    return {
        "message": f"Hello {user.email}!",
        "user_id": user.id,
        "tier": user.subscription_tier
    }
```

### Backend: Requiring Subscription Tier

```python
from app.core.auth import require_subscription

@router.post("/api/premium-feature")
async def premium_feature(
    user: AuthUser = Depends(require_subscription("pro"))
):
    """This endpoint requires Pro subscription."""
    return {"message": "Premium feature accessed!"}
```

### Frontend: Using Auth in Components

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <p>Welcome, {user?.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Frontend: Making Authenticated API Calls

```typescript
import { apiClient } from '@/services/api';

// No need to manually add auth headers - they're added automatically!
const response = await apiClient.post('/api/workflows/generate', {
  platform: 'n8n',
  // ... other data
});
```

---

## Security Features

### ✅ Implemented Security Measures

1. **JWT Token Verification:**
   - Backend verifies tokens with Supabase on every request
   - Invalid tokens result in 401 Unauthorized

2. **HTTP-Only Session Management:**
   - Supabase handles secure token storage
   - No manual token management required

3. **Automatic Token Refresh:**
   - Supabase client handles token refresh automatically
   - Seamless user experience

4. **CORS Protection:**
   - Configured in backend `main.py`
   - Only allows specified origins

5. **Rate Limiting:**
   - Free tier: 5 workflows max
   - Pro tier: Unlimited workflows
   - Enforced at API level

6. **User Data Isolation:**
   - All workflows filtered by `created_by` user_id
   - Users can only access their own data

7. **Production Security Headers:**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Strict-Transport-Security

---

## Testing

### Manual Testing

#### 1. Sign Up Flow
```bash
# Frontend
1. Navigate to http://localhost:5173/signup
2. Enter email and password
3. Check email for verification link (if configured)
4. Click verification link
5. Sign in at /login
```

#### 2. Protected Route Access
```bash
# Without authentication
curl http://localhost:8000/api/auth/me
# Should return: {"detail": "Not authenticated"}

# With authentication (get token from browser dev tools)
curl -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
     http://localhost:8000/api/auth/me
# Should return: user profile
```

#### 3. Workflow Generation with User
```bash
# Create workflow (authenticated)
curl -X POST http://localhost:8000/api/workflow/generate \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-123",
    "platform": "n8n"
  }'
```

### Automated Tests

Create test file: `automation-chatbot-backend/tests/test_auth.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_protected_route_without_auth():
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_protected_route_with_invalid_token():
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401

# Add more tests...
```

---

## Troubleshooting

### Common Issues

#### 1. "Not authenticated" error on all requests

**Cause:** Frontend not sending auth token

**Solution:**
- Check that Supabase env vars are set in frontend `.env`
- Verify user is signed in: `console.log(await supabase.auth.getSession())`
- Check browser network tab for Authorization header

#### 2. "Invalid authentication credentials"

**Cause:** Token expired or invalid

**Solution:**
- Sign out and sign back in
- Check backend has correct `SUPABASE_URL` and `SUPABASE_KEY`
- Verify Supabase project is active

#### 3. CORS errors when calling API

**Cause:** Frontend URL not in CORS allow list

**Solution:**
```python
# In backend app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "your-production-url"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 4. "Free tier limit reached" immediately

**Cause:** User already has 5 workflows

**Solution:**
- Delete old workflows from Supabase dashboard
- Or upgrade subscription tier in user metadata

#### 5. Redirect loop on login

**Cause:** ProtectedRoute logic issue

**Solution:**
- Check that `/login` and `/signup` routes are NOT wrapped in ProtectedRoute
- Verify user state is updating correctly in AuthContext

---

## Next Steps

### Recommended Enhancements

1. **Email Verification:**
   - Configure Supabase email templates
   - Add verification status check

2. **Password Reset Flow:**
   - Create `/forgot-password` page
   - Implement reset password form

3. **OAuth Providers:**
   - Add Google, GitHub sign-in
   - Configure OAuth apps in Supabase

4. **User Profile Management:**
   - Create profile settings page
   - Allow users to update email, password

5. **Subscription Management:**
   - Integrate Stripe/payment provider
   - Add subscription upgrade flow

6. **Session Management:**
   - Add "remember me" functionality
   - Implement session timeout warnings

7. **Admin Dashboard:**
   - Create admin role checking
   - Add user management UI

---

## API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/auth/me` | ✅ | Get current user profile |
| POST | `/api/auth/refresh` | ✅ | Refresh authentication token |

### Protected Workflow Endpoints

| Method | Endpoint | Auth Required | Tier Required | Description |
|--------|----------|---------------|---------------|-------------|
| POST | `/api/workflow/generate` | ✅ | Free (limited) | Generate workflow |
| GET | `/api/workflow/templates` | ✅ | Free | List templates |
| POST | `/api/workflow/{id}/export` | ✅ | Free | Export workflow |

---

## Summary

✅ **Completed Implementation:**

- ✅ Backend authentication middleware with Supabase
- ✅ Protected API endpoints with JWT verification
- ✅ User-based workflow filtering
- ✅ Subscription tier enforcement
- ✅ Frontend AuthContext with Supabase
- ✅ Login and Signup pages
- ✅ Protected route component
- ✅ API client with automatic auth headers
- ✅ Environment configuration

**The authentication system is fully functional and ready for use!**

Users must now sign up and sign in to use the application. All workflows are associated with the authenticated user, and free tier users are limited to 5 workflows.

---

For questions or issues, refer to:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [FastAPI Security Documentation](https://fastapi.tiangolo.com/tutorial/security/)
- [Project README](./README.md)


