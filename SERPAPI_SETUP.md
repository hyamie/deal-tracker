# SerpApi Setup for Deal Tracker

## Why SerpApi?

The original vendor search used web scraping, which fails frequently due to:
- Anti-bot protection (Walmart, Target, Amazon, etc.)
- Dynamic JavaScript rendering
- Rate limiting and IP blocks
- Frequent page structure changes

**SerpApi solves all of this with ZERO cost for personal use!**

## Setup Instructions (5 minutes)

### 1. Sign Up for Free Account

1. Go to **https://serpapi.com**
2. Click "Sign Up" (top right)
3. Enter your email and create a password
4. **No credit card required!**

### 2. Get Your API Key

1. After signing up, you'll be on the dashboard
2. Your API key is displayed at the top
3. Copy the API key (looks like: `abc123def456...`)

### 3. Add API Key to Environment Variables

**Local Development:**
1. Open `.env.local` in the deal-tracker folder
2. Find the line that says `SERPAPI_KEY=`
3. Paste your API key after the `=`
4. Save the file

**Production (Vercel):**
```bash
cd /c/ClaudeAgents/projects/deal-tracker
vercel env add SERPAPI_KEY
# Paste your API key when prompted
# Select: Production
```

### 4. Test It Out

1. Restart your local dev server if running:
   ```bash
   npm run dev
   ```

2. Add a product or refresh an existing one
3. You should now see alternative pricing from Google Shopping + eBay!

## What You Get

### Free Tier
- **100 searches per month** (more than enough for personal use)
- Google Shopping results in clean JSON
- ~5 second response time
- No credit card required

### Results
- Real-time prices from dozens of retailers
- Direct product links
- Much more reliable than web scraping
- Falls back to eBay if SerpApi quota is exceeded

## How It Works

When you check a product price:

1. **If SerpApi key is configured:**
   - Searches Google Shopping for alternatives (uses 1 API call)
   - Also searches eBay as backup
   - Results cached for 24 hours to save API calls

2. **If no SerpApi key:**
   - Only searches eBay (less reliable)
   - Shows warning in console logs

## Monitoring Usage

Check your usage at: https://serpapi.com/dashboard

You can see:
- API calls used this month
- Remaining free searches
- Response times

## Cost Estimate

For personal use tracking 10-20 products:
- Daily auto-check: ~15-20 API calls/month
- Manual refresh: ~10-15 API calls/month
- **Total: ~30-35 calls/month**
- **100% FREE** (under the 100/month limit)

Even with heavy usage, you won't exceed the free tier!

## Troubleshooting

### No alternatives showing up

1. Check if SERPAPI_KEY is set:
   ```bash
   echo $SERPAPI_KEY
   ```

2. Check Vercel environment variables:
   ```bash
   vercel env ls
   ```

3. Look at console logs when checking a product - should see:
   ```
   Using SerpApi for Google Shopping results...
   SerpApi: Found X results
   ```

### Rate limit errors

If you see "rate limit exceeded":
- You've used all 100 free searches this month
- The app will fall back to eBay only
- Wait until next month or upgrade to paid plan

### Invalid API key

- Double-check you copied the entire key
- Make sure there are no spaces before/after the key
- Verify the key is active at https://serpapi.com/dashboard

## Alternative: Without SerpApi

The app still works without SerpApi, but with limitations:
- Only searches eBay for alternatives
- eBay scraping can be unreliable
- Fewer alternative results

To maximize results, **highly recommended to add SerpApi key!**
