# Deployment Guide

This guide walks you through deploying theunpartyapp to production. We'll cover everything from environment setup to post-deployment verification.

## 📋 Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Vercel Deployment](#vercel-deployment)
- [Environment Variables Setup](#environment-variables-setup)
- [Database Migration](#database-migration)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting Deployment Issues](#troubleshooting-deployment-issues)

---

## Pre-Deployment Checklist

Before deploying, make sure you have:

- [ ] Database set up, if you want one (see [DATABASE_SETUP.md](./DATABASE_SETUP.md)). A copy deploys and runs without it
- [ ] ✅ **Clerk account** with API keys ([clerk.com](https://clerk.com))
- [ ] ✅ **All code committed** to your Git repository
- [ ] ✅ **Local build successful** (`npm run build`)
- [ ] ✅ **Environment variables documented** (use `.env.example` as reference)

---

## Vercel Deployment

### First-Time Setup

1. **Sign up for Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "Sign Up"
   - Choose "Continue with GitHub" (recommended)
   - Authorize Vercel to access your repositories

2. **Import your project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository (`unparty-app/theunpartyapp`)
   - Click "Import"

3. **Configure project settings**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Set up environment variables** (see next section)

5. **Deploy**
   - Click "Deploy"
   - Wait 3-5 minutes for first deployment
   - Vercel will assign you a URL: `your-project.vercel.app`

### Subsequent Deployments

After initial setup, deployments are automatic:
- **Push to `main` branch** → Deploys to production
- **Push to other branches** → Creates preview deployments
- **Open Pull Request** → Creates preview deployment with unique URL

---

## Environment Variables Setup

### Database and Sign-In

None of these are needed to deploy. With none, the site runs with no sign-in, `/admin` and `/party` locked, and database-backed sections empty. Set them when you want those:

#### 1. Database

```bash
DATABASE_URL
```
- **Get from:** Your database provider (see [DATABASE_SETUP.md](./DATABASE_SETUP.md))
- **Example:** `postgresql://user:pass@host.supabase.co:5432/postgres`
- **Environments:** Production, Preview, Development

#### 2. Authentication (Clerk)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
```
- **Get from:** [dashboard.clerk.com](https://dashboard.clerk.com)
- **Steps:**
  1. Go to your Clerk dashboard
  2. Select your application
  3. Go to "API Keys"
  4. Copy both keys
- **Use:** Production keys (`pk_live_...` and `sk_live_...`) for production
- **Environments:** Production, Preview, Development

### Optional Variables

These enhance functionality but aren't required:

```bash
# Slack notifications
SLACK_TOKEN="xoxb-your-slack-token"

# Google Sheets integration
GOOGLE_SHEETS_ID="your-sheet-id"
GOOGLE_SERVICE_ACCOUNT_EMAIL="service@project.iam.gserviceaccount.com"

# Admin user identification
FOUNDER_USER_ID="user_xxxxx"

# Private GitHub repository
GITHUB_PRIVATE_REPO="https://github.com/org/repo"
```

### How to Add Variables in Vercel

#### Method 1: Dashboard (Recommended)

1. **Go to your project in Vercel dashboard**
   - [vercel.com/dashboard](https://vercel.com/dashboard)

2. **Navigate to Settings**
   - Click your project
   - Click "Settings" tab
   - Click "Environment Variables" in sidebar

3. **Add each variable**
   - Click "Add New"
   - **Name:** Enter variable name (e.g., `DATABASE_URL`)
   - **Value:** Enter the actual value
   - **Environments:** Select all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click "Save"

4. **Repeat for each variable you're using**

5. **Redeploy**
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"

#### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Add environment variable
vercel env add DATABASE_URL

# You'll be prompted to:
# 1. Enter the value
# 2. Select environments (Production, Preview, Development)

# Pull variables into your local .env (this replaces the file's contents,
# so make sure everything you need is saved in Vercel first)
vercel env pull .env
```

#### Method 3: Bulk Import

If you have many variables:

1. **Prepare a file** (e.g., `env-production.txt`):
   ```bash
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   ```

2. **In Vercel dashboard:**
   - Settings → Environment Variables
   - Click "Import" (top right)
   - Paste all variables
   - Select environments
   - Click "Import"

---

## Database Migration

### First Deployment (New Database)

When deploying for the first time with a fresh database:

1. **Ensure DATABASE_URL is set** in Vercel environment variables

2. **Deploy the application**
   - The build process includes `prisma migrate deploy`
   - This creates all database tables automatically

3. **Verify migration succeeded**
   - Check deployment logs in Vercel
   - Look for: "✓ Database migrations completed"

4. **Seed initial data (optional)**
   - You may need to manually seed some data
   - Options:
     - Use Prisma Studio: `npm run db:studio`
     - Run seed script: `npm run db:seed`
     - Manually insert via database provider's interface

### Subsequent Deployments (Existing Database)

For updates with schema changes:

1. **Develop locally first**
   ```bash
   # Make schema changes in prisma/schema.prisma
   
   # Create and apply migration
   npm run db:migrate
   
   # Test locally
   npm run dev
   ```

2. **Commit migration files**
   ```bash
   git add prisma/migrations/
   git commit -m "Add new database migration"
   git push
   ```

3. **Deploy**
   - Vercel automatically runs `prisma migrate deploy`
   - Migrations apply to production database
   - Application deploys with updated schema

### Manual Migration (if needed)

If automatic migration fails:

```bash
# Connect to production via Vercel CLI
vercel env pull .env.production

# Run migration against production
DATABASE_URL="your-production-url" npx prisma migrate deploy

# Or use your database provider's CLI tools
```

---

## Post-Deployment Verification

### 1. Check Build Status

- **Vercel Dashboard** → "Deployments"
- Latest deployment should show: ✅ "Ready"
- Click on deployment to see build logs
- Verify no errors in "Building" phase

### 2. Test Core Functionality

Visit your deployment URL and test:

- [ ] **Homepage loads** - Visit `https://your-app.vercel.app`
- [ ] **Authentication works** - Try signing in/up
- [ ] **Database connectivity** - Check that dynamic content loads
- [ ] **API routes respond** - Test key endpoints
- [ ] **Admin panel accessible** - Navigate to `/admin` (if authenticated)

### 3. Check Environment Variables

If something doesn't work:

1. **Verify all variables are set**
   - Settings → Environment Variables
   - Ensure all required variables are present
   - Check values don't have extra spaces or quotes

2. **Check variable scope**
   - Each variable should be enabled for Production
   - Click "Edit" to verify environments

3. **Redeploy if variables were changed**
   - Deployments → Latest → "..." → "Redeploy"

### 4. Monitor for Errors

- **Vercel Logs:** Deployments → [deployment] → "Logs"
- **Runtime Logs:** Monitor for errors in first few minutes
- **Analytics:** Vercel → Analytics (if enabled)

---

## Troubleshooting Deployment Issues

### ❌ Build Fails: "Environment variable not found: DATABASE_URL"

**Problem:** DATABASE_URL is not set in Vercel.

**Solution:**
1. Go to Settings → Environment Variables
2. Add `DATABASE_URL` with your connection string
3. Select all environments
4. Save and redeploy

**Detailed guide:** See [DATABASE_SETUP.md](./DATABASE_SETUP.md)

---

### ❌ Build Fails: "prisma migrate deploy failed"

**Problem:** Database migration error.

**Possible causes:**
1. Database is unreachable
2. Invalid DATABASE_URL format
3. Database lacks required permissions

**Solutions:**

1. **Verify DATABASE_URL:**
   ```bash
   # Should follow this format:
   postgresql://username:password@host:port/database
   ```

2. **Check database is accessible:**
   - Test connection using database provider's tools
   - Verify database is running
   - Check firewall/security settings

3. **Reset and retry:**
   ```bash
   # Locally, test the migration
   npm run db:push
   
   # If successful, redeploy
   git push
   ```

---

### ❌ Runtime Error: "Can't reach database server"

**Problem:** Application can't connect to database at runtime.

**Solutions:**

1. **Check DATABASE_URL is set for Production:**
   - Settings → Environment Variables
   - Verify "Production" is checked for DATABASE_URL

2. **Verify connection string format:**
   - Must include `?sslmode=require` for most cloud databases:
   ```bash
   postgresql://user:pass@host:5432/db?sslmode=require
   ```

3. **Check database provider status:**
   - Visit your database provider's status page
   - Ensure no ongoing incidents

---

### ❌ Authentication Error: "Clerk publishable key invalid"

**Problem:** Clerk API keys not set or incorrect.

**Solutions:**

1. **Verify keys in Vercel:**
   - Settings → Environment Variables
   - Check both:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`

2. **Ensure using production keys:**
   - For production, use `pk_live_...` and `sk_live_...`
   - Test keys (`pk_test_...`) only work in development

3. **Regenerate keys if needed:**
   - Clerk Dashboard → API Keys
   - Generate new keys if compromised
   - Update in Vercel
   - Redeploy

---

### ❌ Build Succeeds but Pages Show 500 Error

**Problem:** Runtime error after successful build.

**Solutions:**

1. **Check Vercel logs:**
   - Deployments → [your deployment] → "Logs"
   - Look for error messages in "Runtime Logs"

2. **Common causes:**
   - Missing environment variable for optional feature
   - Database migration incomplete
   - API key invalid

3. **Test with verbose logging:**
   - Add temporary logging to identify issue
   - Redeploy and check logs

---

### ❌ "Too many redirects" or "Redirect loop"

**Problem:** Authentication redirect loop.

**Solutions:**

1. **Check Clerk redirect URLs:**
   - Clerk Dashboard → your app → "Paths"
   - Ensure redirect URLs match your Vercel domain

2. **Update Clerk domains:**
   - Add your Vercel domain: `your-app.vercel.app`
   - Include all preview URLs if needed

---

## 🔒 Security Best Practices

### Before Going Live:

1. **✅ Use production keys**
   - Clerk: `pk_live_...` and `sk_live_...`

2. **✅ Enable environment restrictions**
   - In Vercel, use separate keys for Preview vs Production
   - Rotate keys regularly

3. **✅ Review Clerk security settings**
   - Enable 2FA on provider accounts
   - Set up webhook signing secrets
   - Configure CORS if needed

4. **✅ Check database security**
   - Use strong passwords
   - Enable SSL connections
   - Restrict access by IP if possible

5. **✅ Monitor deployments**
   - Enable Vercel email notifications
   - Set up Slack integration for deploy alerts
   - Monitor error rates in first 24 hours

---

## 📊 Deployment Checklist

Use this checklist for each deployment:

### Pre-Deployment
- [ ] Local build succeeds: `npm run build`
- [ ] All tests pass (if applicable)
- [ ] Environment variables documented
- [ ] Database migration tested locally
- [ ] Code committed and pushed

### During Deployment
- [ ] Build succeeds in Vercel
- [ ] No errors in build logs
- [ ] Deployment shows "Ready" status

### Post-Deployment
- [ ] Homepage loads
- [ ] Authentication works
- [ ] Database queries succeed
- [ ] API routes respond
- [ ] No errors in runtime logs
- [ ] Monitor for 15-30 minutes

### Production-Specific
- [ ] Using production API keys
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate valid
- [ ] Monitoring/analytics enabled

---

## 🚀 Advanced: Custom Domain

To use your own domain (e.g., `www.yourdomain.com`):

1. **In Vercel:**
   - Project → Settings → Domains
   - Enter your domain
   - Follow DNS instructions

2. **With your domain registrar:**
   - Add DNS records as instructed by Vercel
   - Wait for DNS propagation (can take 24-48 hours)

3. **Configure Clerk redirect URLs:**
   - Update to include your custom domain
   - Update CORS settings if applicable

---

## 📈 Monitoring and Maintenance

### Regular Tasks:

- **Weekly:** Check deployment logs for errors
- **Monthly:** Review and rotate API keys
- **Quarterly:** Update dependencies: `npm update`
- **As needed:** Database backups (check your provider)

### Set Up Monitoring:

1. **Vercel Analytics** (free for Pro accounts)
   - Enable in project settings
   - Monitor traffic and performance

2. **Error tracking** (optional)
   - Consider Sentry, LogRocket, or similar
   - Track runtime errors in production

3. **Uptime monitoring** (optional)
   - Use UptimeRobot, Pingdom, or similar
   - Get alerts if site goes down

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database configuration
- [VERCEL_ENV_SETUP.md](../../src/app/theunpartyapp/VERCEL_ENV_SETUP.md) - Environment variables reference
- [Prisma Deployment Docs](https://www.prisma.io/docs/guides/deployment)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)

---

**Need Help?** Check the [Troubleshooting](#troubleshooting-deployment-issues) section above or review the deployment logs in Vercel for specific error messages.