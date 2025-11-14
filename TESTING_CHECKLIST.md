# Testing Checklist ✅

## Pre-Testing Setup

- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:5173
- [ ] Database tables created in Supabase
- [ ] Environment variables configured
- [ ] API docs accessible at http://localhost:8000/docs

## Automated Test Suite

Visit: **http://localhost:5173/test**

### Test Results Expected

| Test | Expected Result | Status |
|------|----------------|--------|
| Health Check | ✅ Backend returns status "healthy" | |
| Chat Message | ✅ AI responds to user message | |
| Workflow Generation | ✅ Creates workflow with valid ID | |
| Validation | ✅ Validates workflow structure | |
| Export | ✅ Downloads JSON file | |

## Manual Testing Scenarios

### 1. Basic Chat Flow

**Steps:**
1. Open http://localhost:5173
2. Type: "Send email when form submitted"
3. Select platform: Zapier
4. Click send

**Expected:**
- [ ] Message appears in chat
- [ ] AI responds with workflow suggestion
- [ ] Loading indicator shows during processing
- [ ] Response appears within 5-10 seconds

### 2. Workflow Generation

**Steps:**
1. Use chat to describe automation
2. AI generates workflow
3. View workflow on canvas

**Expected:**
- [ ] Workflow appears on right panel
- [ ] Nodes are connected properly
- [ ] Platform-specific format (Zapier/Make/n8n)
- [ ] No validation errors

### 3. Template Usage

**Steps:**
1. Browse templates on home page
2. Click a template
3. Customize parameters
4. Generate workflow

**Expected:**
- [ ] Template loads with prefilled data
- [ ] Can customize parameters
- [ ] Generates correct workflow
- [ ] Saves to database

### 4. Workflow Export

**Steps:**
1. Generate a workflow
2. Click export button
3. File downloads

**Expected:**
- [ ] JSON file downloads
- [ ] Filename includes workflow ID
- [ ] Valid JSON structure
- [ ] Can be imported to platform

### 5. Validation System

**Steps:**
1. Generate workflow
2. Modify to create invalid state
3. Run validation

**Expected:**
- [ ] Catches missing required fields
- [ ] Identifies invalid connections
- [ ] Shows clear error messages
- [ ] Prevents export of invalid workflows

### 6. Error Handling

**Test scenarios:**

**Backend offline:**
- [ ] Shows connection error toast
- [ ] Retry button appears
- [ ] No app crash

**Invalid API key:**
- [ ] Shows authentication error
- [ ] Helpful error message
- [ ] Suggests checking .env

**Validation failure:**
- [ ] Lists all errors
- [ ] Points to problem areas
- [ ] Allows fixes

### 7. Platform Switching

**Steps:**
1. Generate workflow for Zapier
2. Switch to Make
3. Regenerate

**Expected:**
- [ ] Different JSON structure
- [ ] Platform-specific fields
- [ ] Correct validation rules
- [ ] Proper export format

### 8. Database Persistence

**Steps:**
1. Generate workflow
2. Close browser
3. Reopen app
4. Check workflows list

**Expected:**
- [ ] Workflow saved in database
- [ ] Can retrieve by ID
- [ ] Chat history preserved
- [ ] All metadata intact

## API Endpoint Tests

### Health Check
```bash
curl http://localhost:8000/health
```
Expected: `{"status": "healthy", ...}`

### Chat Message
```bash
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test-123", "message": "Hello", "platform": "zapier"}'
```
Expected: `{"message": "...", "session_id": "test-123"}`

### Generate Workflow
```bash
curl -X POST http://localhost:8000/api/workflows/generate \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "zapier",
    "intent": {"trigger": {"app": "Gmail"}, "actions": []},
    "parameters": {}
  }'
```
Expected: `{"workflow": {...}, "validation": {...}}`

### List Workflows
```bash
curl http://localhost:8000/api/workflows
```
Expected: `[{...}, {...}]`

### Get Platforms
```bash
curl http://localhost:8000/api/platforms
```
Expected: `[{"id": "zapier", ...}, ...]`

## Performance Tests

- [ ] Chat response < 10 seconds
- [ ] Workflow generation < 5 seconds
- [ ] UI remains responsive during generation
- [ ] No memory leaks on repeated use
- [ ] Handles 10+ workflows smoothly

## Browser Compatibility

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile responsive

## Security Checks

- [ ] API keys not exposed in frontend
- [ ] CORS properly configured
- [ ] No sensitive data in console logs
- [ ] SQL injection protection (Supabase handles)
- [ ] Input sanitization

## Known Issues / Limitations

Document any issues found during testing:

1. **Issue:** 
   - **Impact:** 
   - **Workaround:** 

2. **Issue:** 
   - **Impact:** 
   - **Workaround:** 

## Test Environment Info

- **Backend Port:** 8000
- **Frontend Port:** 5173
- **Database:** Supabase PostgreSQL
- **AI Provider:** OpenAI / Anthropic
- **Node Version:** 
- **Python Version:** 

## Sign-Off

- [ ] All automated tests passing
- [ ] Manual scenarios verified
- [ ] API endpoints responding correctly
- [ ] Error handling working
- [ ] Performance acceptable
- [ ] Ready for demo/production

**Tested by:** _______________  
**Date:** _______________  
**Environment:** Development / Staging / Production

---

## Quick Test Commands

```bash
# Test backend health
curl http://localhost:8000/health

# Test frontend build
cd automation-chatbot-frontend && npm run build

# Check backend logs
cd automation-chatbot-backend && tail -f uvicorn.log

# Run all frontend tests
cd automation-chatbot-frontend && npm test

# Check database connection
cd automation-chatbot-backend && python test_database.py
```

## Debugging Tips

1. **Backend not responding:** Check logs for errors
2. **Frontend API errors:** Check Network tab in browser DevTools
3. **Database issues:** Verify tables exist in Supabase
4. **AI errors:** Check API key validity and quota
5. **CORS errors:** Verify CORS_ORIGINS in backend .env

---

**For automated test results, visit:** http://localhost:5173/test

