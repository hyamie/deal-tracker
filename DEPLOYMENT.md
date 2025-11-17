# Deal Tracker - Deployment Guide

Your app is ready to deploy! Follow these steps to get it live on Vercel.

## Step 1: Set Up Supabase (5 minutes)

1. Go to https://supabase.com
2. Sign up for free account
3. Click "New Project"
4. Fill in:
   - Project name: `deal-tracker`
   - Database Password: (save this - you'll need it!)
   - Region: Choose closest to you
5. Wait for project creation (2-3 minutes)
6. Go to SQL Editor > New Query
7. Copy and paste the entire contents of `supabase-schema.sql`
8. Click "Run" to create all tables
9. Go to Settings > API and copy:
   - `Project URL` - this is your NEXT_PUBLIC_SUPABASE_URL
   - `anon/public key` - this is your NEXT_PUBLIC_SUPABASE_ANON_KEY

## Step 2: Configure Vercel Environment Variables

Your project has been linked to Vercel but needs environment variables to build successfully.

### Option A: Using Vercel Dashboard (Easiest)

1. Go to https://vercel.com/mike-hyams-projects/deal-tracker
2. Click "Settings" tab
3. Click "Environment Variables" in the sidebar
4. Add these variables (one at a time):

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: (paste your Project URL from Supabase)
Environment: Production, Preview, Development
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: (paste your anon key from Supabase)
Environment: Production, Preview, Development
```

```
Name: NEXT_PUBLIC_USER_EMAIL
Value: your_email@example.com
Environment: Production, Preview, Development
```

```
Name: CRON_SECRET
Value: (generate a random string, or use: my-secret-cron-key-12345)
Environment: Production, Preview, Development
```

5. Click "Save" for each variable

### Option B: Using Vercel CLI

```bash
cd C:/ClaudeAgents/projects/deal-tracker

# Set each variable
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your value when prompted
# Select all environments (Production, Preview, Development)

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your value

vercel env add NEXT_PUBLIC_USER_EMAIL
# Enter your email

vercel env add CRON_SECRET
# Enter a random secret string
```

## Step 3: Redeploy

After adding environment variables:

### Option A: Through Dashboard
1. Go to https://vercel.com/mike-hyams-projects/deal-tracker
2. Click "Deployments" tab
3. Click the three dots (...) on the latest deployment
4. Click "Redeploy"
5. Check "Use existing Build Cache"
6. Click "Redeploy"

### Option B: Through CLI
```bash
cd C:/ClaudeAgents/projects/deal-tracker
vercel --prod --yes
```

## Step 4: Test Your Live App

Once deployment succeeds:

1. Visit your app URL (shown after deployment)
2. Click "Add New Product"
3. Try adding a product from Amazon or Best Buy
4. Test the price checking feature

## Your App URLs

- GitHub: https://github.com/hyamie/deal-tracker
- Vercel Project: https://vercel.com/mike-hyams-projects/deal-tracker
- Live App: (will be shown after successful deployment)

## Troubleshooting

### Build still failing after adding env vars?
- Make sure all 4 environment variables are set
- Check they're set for "Production" environment
- Try redeploying from scratch

### Supabase connection errors?
- Verify your Supabase URL and key are correct
- Make sure you ran the schema SQL file
- Check if Row Level Security (RLS) is disabled on tables

### Can't add products?
- Check browser console for errors
- Verify Supabase connection
- Make sure NEXT_PUBLIC_USER_EMAIL is set

## Next Steps

Once deployed:
- The cron job will run daily at 9 AM UTC to check all prices
- You can manually check prices anytime by clicking "Check Price" buttons
- Add target prices to get notified (via UI) when deals are found
- Check price history to see trends

Enjoy your Deal Tracker!
