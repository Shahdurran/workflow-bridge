# 🚀 Deployment Guide

Complete guide for deploying Workflow Automation Bridge to production.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account (for repository hosting)
- [ ] Supabase account (database)
- [ ] OpenAI or Anthropic API key (AI service)
- [ ] Backend hosting account (Railway/Render/Heroku)
- [ ] Frontend hosting account (Vercel/Netlify)
- [ ] All local tests passing

---

## 🎯 Quick Deployment (15 minutes)

### Step 1: Database Setup (5 minutes)

1. **Create Supabase Project**
   - Visit https://supabase.com
   - Click "New Project"
   - Name: `workflow-automation-bridge`
   - Choose region closest to your users
   - Set database password (save it!)

2. **Run Database Schema**
   - Open SQL Editor in Supabase
   - Copy contents of `database_schema.sql`
   - Click "Run"
   - Verify tables created

3. **Get API Keys**
   - Go to Settings → API
   - Copy `URL` and `service_role` key
   - Save for backend deployment

### Step 2: Backend Deployment (5 minutes)

**Option A: Railway (Recommended) ⚡**

1. **Deploy**
   ```bash
   # Install Railway CLI (optional)
   npm install -g @railway/cli
   
   # Or use web interface
   ```
   - Visit https://railway.app
   - Click "New Project" → "Deploy from GitHub"
   - Select `automation-chatbot-backend` folder
   - Railway auto-detects Python

2. **Configure Environment Variables**
   ```
   OPENAI_API_KEY=sk-your-key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-service-role-key
   SUPABASE_SERVICE_KEY=your-service-role-key
   ENVIRONMENT=production
   DEBUG=false
   LOG_LEVEL=WARNING
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```

3. **Get Backend URL**
   - Railway generates URL: `https://your-app.railway.app`
   - Save this for frontend configuration

**Option B: Render**

1. **Create Web Service**
   - Visit https://render.com
   - Click "New" → "Web Service"
   - Connect GitHub repository
   - Root Directory: `automation-chatbot-backend`

2. **Configure**
   - Name: `workflow-automation-backend`
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Add Environment Variables** (same as Railway)

4. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment

**Option C: Heroku**

1. **Create App**
   ```bash
   heroku create your-app-name
   heroku config:set OPENAI_API_KEY=sk-your-key
   heroku config:set SUPABASE_URL=https://your-project.supabase.co
   # ... add all environment variables
   ```

2. **Deploy**
   ```bash
   git subtree push --prefix automation-chatbot-backend heroku main
   ```

### Step 3: Frontend Deployment (5 minutes)

**Option A: Vercel (Recommended) ⚡**

1. **Deploy**
   - Visit https://vercel.com
   - Click "Add New" → "Project"
   - Import `automation-chatbot-frontend`
   - Framework Preset: Vite
   - Root Directory: `automation-chatbot-frontend`

2. **Configure**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables**
   ```
   VITE_API_BASE_URL=https://your-backend.railway.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get URL: `https://your-app.vercel.app`

**Option B: Netlify**

1. **Deploy**
   - Visit https://netlify.com
   - Click "Add new site" → "Import from Git"
   - Select repository

2. **Configure**
   - Base directory: `automation-chatbot-frontend`
   - Build command: `npm run build`
   - Publish directory: `automation-chatbot-frontend/dist`

3. **Environment Variables**
   ```
   VITE_API_BASE_URL=https://your-backend.railway.app
   ```

4. **Deploy**
   - Click "Deploy site"
   - Get URL: `https://your-app.netlify.app`

---

## 🔧 Post-Deployment Configuration

### Update CORS Origins

After frontend deployment, update backend CORS:

**Railway:**
- Go to your backend project
- Variables tab
- Update `CORS_ORIGINS` to your frontend URL
- Redeploy

**Render:**
- Go to your web service
- Environment tab
- Update `CORS_ORIGINS`
- Save changes (auto-redeploys)

### Test Deployment

1. **Visit Frontend**
   - Open your frontend URL
   - Go to `/test` page
   - Click "Run All Tests"
   - Verify all pass ✅

2. **Check Health Endpoint**
   ```bash
   curl https://your-backend.railway.app/health
   ```

3. **Test API Documentation**
   - Visit `https://your-backend.railway.app/docs`
   - Try a few endpoints

### Seed Template Data (Optional)

SSH into backend or run locally:
```bash
# If you have railway CLI
railway run python seed_templates.py

# Or use Render shell
# Or seed from local pointing to production database
```

---

## 🐳 Docker Deployment (Alternative)

### Using Docker Compose

1. **Build and Run**
   ```bash
   docker-compose up --build -d
   ```

2. **Check Status**
   ```bash
   docker-compose ps
   docker-compose logs
   ```

3. **Stop**
   ```bash
   docker-compose down
   ```

### Deploy to Docker-Based Platforms

**Railway with Docker:**
```bash
railway up
```

**Render with Docker:**
- Set Docker as build environment
- Dockerfile detected automatically

**AWS ECS / Google Cloud Run:**
```bash
# Build and push
docker build -t your-backend ./automation-chatbot-backend
docker push your-registry/your-backend

# Deploy using platform CLI
```

---

## 📊 Monitoring & Maintenance

### Set Up Monitoring

**Railway:**
- Built-in metrics and logs
- Set up deploy webhooks
- Configure email alerts

**Render:**
- View logs in dashboard
- Set up health check endpoint
- Configure email notifications

**Supabase:**
- Database monitoring
- Query performance
- Storage usage

### Set Up Alerts

**OpenAI Usage:**
- Visit https://platform.openai.com/usage
- Set usage limits
- Configure email alerts

**Uptime Monitoring:**
- UptimeRobot (free)
- Pingdom
- StatusCake

Monitor endpoint: `https://your-backend.railway.app/health`

### Log Aggregation (Optional)

**Sentry (Error Tracking):**
```python
# Add to requirements.txt
sentry-sdk[fastapi]

# Add to main.py
import sentry_sdk
sentry_sdk.init(dsn="your-sentry-dsn")
```

**Logtail / Datadog:**
- Connect to Railway/Render
- Real-time log streaming
- Advanced analytics

---

## 💰 Cost Estimates

### Free Tier (Recommended for MVP)

| Service | Free Tier | Limits |
|---------|-----------|--------|
| **Railway** | $5 credit/month | 500 hours/month |
| **Render** | Free | 750 hours/month |
| **Vercel** | Free | 100GB bandwidth, unlimited deploys |
| **Netlify** | Free | 100GB bandwidth, 300 build minutes |
| **Supabase** | Free | 500MB database, 2GB bandwidth |
| **OpenAI** | Pay per use | ~$0.002 per request (GPT-4) |

**Total: $0-10/month** for moderate usage

### Production Tier (Scaling Up)

| Service | Cost | Includes |
|---------|------|----------|
| **Railway** | $20/month | Better resources, no sleep |
| **Render** | $7/month | Always-on, better CPU |
| **Vercel Pro** | $20/month | More bandwidth, team features |
| **Supabase Pro** | $25/month | 8GB database, better support |
| **OpenAI** | Variable | Usage-based pricing |

**Total: $70-100/month** for production app

---

## 🔒 Security Checklist

Before going live:

- [ ] Environment variables secured (not in code)
- [ ] CORS properly configured (specific origins only)
- [ ] HTTPS enabled (automatic on Railway/Vercel)
- [ ] API keys rotated from development
- [ ] Rate limiting enabled
- [ ] Error messages don't expose secrets
- [ ] Database backup configured
- [ ] Security headers enabled
- [ ] Input validation on all endpoints
- [ ] Logging configured (no sensitive data)

---

## 🐛 Troubleshooting

### Backend Won't Deploy

**Issue:** Build fails
- Check Python version (3.11+)
- Verify all dependencies in requirements.txt
- Check environment variables

**Issue:** App crashes on start
- Check logs: `railway logs` or Render dashboard
- Verify database connection
- Check all required env vars set

### Frontend Can't Connect to Backend

**Issue:** CORS errors
- Verify CORS_ORIGINS includes frontend URL
- Check https:// vs http://
- Verify backend is running

**Issue:** 404 errors
- Verify VITE_API_BASE_URL is correct
- Check backend routes are correct
- Try `/health` endpoint first

### Database Issues

**Issue:** Connection failed
- Verify Supabase URL and key
- Check IP restrictions in Supabase
- Verify tables exist

### High Costs

**Issue:** OpenAI costs too high
- Implement request caching
- Set usage limits in OpenAI dashboard
- Consider GPT-3.5 for some requests
- Add rate limiting

---

## 📈 Scaling Strategies

### When to Scale

Monitor these metrics:
- Response times > 2 seconds
- Error rate > 1%
- CPU usage > 80%
- Memory usage > 80%
- API request rate > 100/minute

### Scaling Options

**Horizontal Scaling:**
- Railway: Add more instances
- Use load balancer
- Implement caching (Redis)

**Vertical Scaling:**
- Upgrade Railway/Render plan
- More CPU/memory

**Database Scaling:**
- Upgrade Supabase plan
- Add read replicas
- Implement connection pooling

**Caching:**
- Add Redis for workflow caching
- Cache AI responses
- Use CDN for static assets

---

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## ✅ Go-Live Checklist

- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Database configured and seeded
- [ ] All environment variables set
- [ ] CORS configured correctly
- [ ] Health check returning 200
- [ ] All tests passing on `/test` page
- [ ] API documentation accessible
- [ ] Monitoring/alerts configured
- [ ] Backup strategy in place
- [ ] Domain name configured (if using custom domain)
- [ ] SSL certificate active (automatic)
- [ ] Team has access to all platforms
- [ ] Documentation updated with production URLs

---

## 📚 Additional Resources

### Platform Documentation

- **Railway:** https://docs.railway.app
- **Render:** https://render.com/docs
- **Vercel:** https://vercel.com/docs
- **Netlify:** https://docs.netlify.com
- **Supabase:** https://supabase.com/docs

### Monitoring Tools

- **UptimeRobot:** https://uptimerobot.com
- **Sentry:** https://sentry.io
- **Logtail:** https://logtail.com

### Support

- Check logs first (Railway/Render dashboard)
- Review TROUBLESHOOTING section
- Test health endpoint
- Check environment variables

---

## 🎉 You're Live!

Once deployed:

1. **Share URLs with team**
   - Frontend: https://your-app.vercel.app
   - Backend: https://your-backend.railway.app
   - API Docs: https://your-backend.railway.app/docs

2. **Monitor first 24 hours**
   - Watch for errors
   - Check response times
   - Monitor API usage
   - Gather user feedback

3. **Iterate and improve**
   - Fix bugs promptly
   - Monitor costs
   - Optimize performance
   - Add features

**Congratulations! Your application is now in production! 🚀**

