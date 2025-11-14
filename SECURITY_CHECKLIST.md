# 🔒 Security Checklist for Production

Complete security checklist before deploying to production.

---

## ✅ Backend Security

### API Keys & Secrets

- [ ] All API keys stored in environment variables (never in code)
- [ ] OpenAI/Anthropic API keys secured
- [ ] Supabase service role key secured (not anon key)
- [ ] JWT secret configured (if using authentication)
- [ ] API keys rotated from development to production
- [ ] `.env` files added to `.gitignore`
- [ ] No secrets in git history (`git log --all --full-history -- "*.env"`)

### CORS Configuration

- [ ] CORS configured with specific allowed origins (not `*`)
- [ ] Frontend URL explicitly listed in `CORS_ORIGINS`
- [ ] No wildcards in production CORS
- [ ] Credentials allowed only if needed
- [ ] Pre-flight requests handled correctly

### Input Validation

- [ ] All user inputs validated
- [ ] Request body size limits set
- [ ] File upload restrictions (if applicable)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output sanitization)
- [ ] Path traversal prevention

### Rate Limiting

- [ ] Rate limiting enabled on production
- [ ] Limits appropriate for your use case
- [ ] Rate limit per IP address
- [ ] Stricter limits for expensive operations (AI calls)
- [ ] Rate limit headers returned to clients

### Authentication & Authorization

- [ ] Secure password hashing (bcrypt/argon2)
- [ ] JWT tokens properly signed and validated
- [ ] Token expiration configured
- [ ] Refresh token rotation
- [ ] Session management secure
- [ ] Role-based access control (if needed)

### HTTPS & Transport Security

- [ ] HTTPS enabled (automatic on Railway/Render)
- [ ] HTTP redirects to HTTPS
- [ ] HSTS header configured
- [ ] TLS 1.2+ only
- [ ] Valid SSL certificate

### Security Headers

- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Strict-Transport-Security` (HSTS)
- [ ] `Content-Security-Policy` (if applicable)
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`

### Error Handling

- [ ] Error messages don't expose sensitive info
- [ ] Stack traces disabled in production
- [ ] Generic error messages for users
- [ ] Detailed errors logged securely
- [ ] No database schema info in errors

### Logging & Monitoring

- [ ] Sensitive data not logged (passwords, tokens, keys)
- [ ] PII (Personal Identifiable Information) handled properly
- [ ] Log levels appropriate (WARNING/ERROR in production)
- [ ] Logs stored securely
- [ ] Log retention policy defined
- [ ] Failed authentication attempts logged

### Dependencies

- [ ] All dependencies up to date
- [ ] Known vulnerabilities patched
- [ ] Dependency scanning enabled (`npm audit`, `pip check`)
- [ ] Unused dependencies removed
- [ ] License compatibility verified

---

## ✅ Frontend Security

### Environment Variables

- [ ] API keys never in frontend code
- [ ] Backend URL configured via environment variable
- [ ] No sensitive data in localStorage/sessionStorage
- [ ] Environment-specific configs separated

### HTTPS & Transport

- [ ] HTTPS enabled (automatic on Vercel/Netlify)
- [ ] Mixed content warnings resolved
- [ ] All API calls use HTTPS
- [ ] No insecure resources loaded

### Content Security Policy

- [ ] CSP headers configured
- [ ] Inline scripts avoided or whitelisted
- [ ] External resources whitelisted
- [ ] `unsafe-eval` and `unsafe-inline` avoided

### XSS Prevention

- [ ] User input sanitized before display
- [ ] React's built-in XSS protection used
- [ ] `dangerouslySetInnerHTML` avoided
- [ ] Third-party scripts vetted

### Authentication

- [ ] Tokens stored securely (httpOnly cookies preferred)
- [ ] Token expiration handled
- [ ] Auto-logout on token expiry
- [ ] Secure session management

### Third-Party Dependencies

- [ ] All npm packages up to date
- [ ] Known vulnerabilities resolved (`npm audit fix`)
- [ ] Package integrity verified
- [ ] Minimal dependencies used

---

## ✅ Database Security

### Supabase Configuration

- [ ] Row Level Security (RLS) policies enabled
- [ ] Service role key only used on backend
- [ ] Anon key for public operations (if any)
- [ ] API keys rotated regularly
- [ ] Connection strings secured

### Access Control

- [ ] Least privilege principle applied
- [ ] Separate read/write permissions
- [ ] Admin access restricted
- [ ] Audit logging enabled

### Data Protection

- [ ] Sensitive data encrypted at rest (Supabase default)
- [ ] Encryption in transit (SSL/TLS)
- [ ] Personal data handling compliant (GDPR if applicable)
- [ ] Data retention policies defined
- [ ] Regular backups configured

### SQL Injection Prevention

- [ ] Parameterized queries used
- [ ] ORM/query builder used (Supabase client)
- [ ] No raw SQL with user input
- [ ] Input validation before queries

---

## ✅ AI Service Security (OpenAI/Anthropic)

### API Key Management

- [ ] API key secured in environment variables
- [ ] Key never exposed to frontend
- [ ] Key rotated periodically
- [ ] Access restricted to backend only

### Usage Controls

- [ ] Rate limits configured
- [ ] Usage caps set
- [ ] Budget alerts configured
- [ ] Cost monitoring enabled

### Data Privacy

- [ ] User data handling policy defined
- [ ] Sensitive data not sent to AI
- [ ] PII handling compliant
- [ ] Data retention understood (OpenAI policies)

### Prompt Injection Prevention

- [ ] User inputs sanitized before AI prompts
- [ ] System prompts protected
- [ ] Output validation implemented
- [ ] Malicious prompt detection

---

## ✅ Infrastructure Security

### Hosting Platforms

- [ ] Railway/Render security best practices followed
- [ ] Vercel/Netlify security settings configured
- [ ] Access control to deployment platforms
- [ ] 2FA enabled on all accounts

### Environment Separation

- [ ] Development, staging, production separated
- [ ] Different API keys per environment
- [ ] Production data not in development
- [ ] Separate Supabase projects per environment

### Access Management

- [ ] Team access properly scoped
- [ ] Service accounts with minimal permissions
- [ ] API tokens with expiration
- [ ] Regular access reviews

### Network Security

- [ ] Firewalls configured (platform defaults)
- [ ] DDoS protection enabled (platform defaults)
- [ ] IP whitelisting (if needed)
- [ ] VPN for sensitive operations (if needed)

---

## ✅ Compliance & Privacy

### Data Protection

- [ ] Privacy policy created
- [ ] Terms of service defined
- [ ] GDPR compliance (if EU users)
- [ ] CCPA compliance (if California users)
- [ ] Data processing agreement (DPA) with vendors

### User Rights

- [ ] Right to data access
- [ ] Right to data deletion
- [ ] Right to data portability
- [ ] Consent management

### Audit & Compliance

- [ ] Security audit completed
- [ ] Penetration testing (for high-security apps)
- [ ] Compliance checklist reviewed
- [ ] Regular security reviews scheduled

---

## ✅ Monitoring & Incident Response

### Monitoring

- [ ] Uptime monitoring configured
- [ ] Error tracking enabled (Sentry, etc.)
- [ ] Performance monitoring
- [ ] Security event logging
- [ ] Anomaly detection

### Alerts

- [ ] Security alerts configured
- [ ] Failed login alerts
- [ ] Unusual traffic alerts
- [ ] API usage spikes
- [ ] Error rate thresholds

### Incident Response

- [ ] Incident response plan defined
- [ ] Security contact information
- [ ] Escalation procedures
- [ ] Backup and recovery plan
- [ ] Post-incident review process

---

## ✅ Deployment Security

### CI/CD Pipeline

- [ ] Secrets not in CI/CD configs
- [ ] Environment variables secured
- [ ] Build artifacts scanned
- [ ] Deploy keys rotated
- [ ] Pipeline access controlled

### Pre-Deployment

- [ ] Security scan before deploy
- [ ] Dependency vulnerabilities checked
- [ ] Code review completed
- [ ] Automated tests passed
- [ ] Manual security testing

### Post-Deployment

- [ ] Health check verified
- [ ] Security headers tested
- [ ] SSL certificate validated
- [ ] CORS configuration tested
- [ ] Authentication tested

---

## 🔍 Security Testing Tools

### Automated Tools

- **npm audit** - Check npm vulnerabilities
  ```bash
  npm audit
  npm audit fix
  ```

- **pip-audit** - Check Python vulnerabilities
  ```bash
  pip install pip-audit
  pip-audit
  ```

- **Safety** - Python dependency scanner
  ```bash
  pip install safety
  safety check
  ```

- **Snyk** - Comprehensive vulnerability scanner
  ```bash
  npm install -g snyk
  snyk test
  ```

### Manual Testing

- **OWASP ZAP** - Web application security scanner
- **Burp Suite** - Security testing toolkit
- **SSL Labs** - SSL/TLS configuration test
  - https://www.ssllabs.com/ssltest/

### Headers Testing

Test security headers:
```bash
curl -I https://your-backend.railway.app
```

Check for:
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`

---

## 📝 Security Documentation

### Documents to Create

- [ ] Security policy
- [ ] Incident response plan
- [ ] Data handling procedures
- [ ] Access control policies
- [ ] Backup and recovery plan

### Team Training

- [ ] Security awareness training
- [ ] Secure coding practices
- [ ] Incident response procedures
- [ ] Data protection training

---

## 🚨 Common Vulnerabilities to Avoid

### OWASP Top 10

1. **Injection** - Use parameterized queries
2. **Broken Authentication** - Implement properly, use proven libraries
3. **Sensitive Data Exposure** - Encrypt data, use HTTPS
4. **XML External Entities (XXE)** - Disable XML processing if not needed
5. **Broken Access Control** - Implement proper authorization
6. **Security Misconfiguration** - Review default settings
7. **Cross-Site Scripting (XSS)** - Sanitize inputs/outputs
8. **Insecure Deserialization** - Validate serialized objects
9. **Using Components with Known Vulnerabilities** - Keep updated
10. **Insufficient Logging & Monitoring** - Log security events

---

## ✅ Final Security Checklist

Before going live:

- [ ] All items in this checklist reviewed
- [ ] Security scan completed
- [ ] Penetration test performed (if needed)
- [ ] Team security training completed
- [ ] Incident response plan in place
- [ ] Monitoring and alerts configured
- [ ] Backup strategy tested
- [ ] Documentation updated
- [ ] Compliance requirements met
- [ ] Security review approved

---

## 📞 Security Resources

- **OWASP:** https://owasp.org
- **Railway Security:** https://docs.railway.app/reference/security
- **Vercel Security:** https://vercel.com/docs/security
- **Supabase Security:** https://supabase.com/docs/guides/platform/security
- **OpenAI Security:** https://platform.openai.com/docs/guides/safety-best-practices

---

**Remember: Security is an ongoing process, not a one-time checklist!**

Regular reviews, updates, and monitoring are essential for maintaining security.

