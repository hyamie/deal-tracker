# Deal Tracker - Quick Start

Your app is LIVE! 🎉

## Your Live App
https://deal-tracker-cskxq5gex-mike-hyams-projects.vercel.app

## Final Step: Run Database Schema (1 minute)

The Supabase SQL editor should be open in your browser. If not, go to:
https://supabase.com/dashboard/project/hutuohivunbneywjuctb/sql/new

1. Copy the ENTIRE contents of `supabase-schema.sql` file
2. Paste it into the SQL editor
3. Click "RUN" button
4. You should see "Success. No rows returned"

That's it! Your database is set up.

## Test Your App

1. Go to https://deal-tracker-cskxq5gex-mike-hyams-projects.vercel.app
2. Click "Add New Product"
3. Try adding a product:
   - Name: NVIDIA RTX 4090
   - URL: https://www.amazon.com/NVIDIA-GeForce-RTX-4090-Graphics/dp/B0BHZ2PZ35
   - Target Price: 1500 (optional)
4. Click "Add Product"
5. Wait for it to scrape the price
6. Click "Check Price" to update manually

## What's Set Up

- ✅ Supabase database (HANA project)
- ✅ Vercel deployment with all environment variables
- ✅ GitHub repository
- ✅ Daily cron job (runs at 9 AM UTC)
- ✅ Price tracking and history
- ✅ Alternative vendor search

## Your URLs

- **Live App**: https://deal-tracker-cskxq5gex-mike-hyams-projects.vercel.app
- **GitHub**: https://github.com/hyamie/deal-tracker
- **Vercel Dashboard**: https://vercel.com/mike-hyams-projects/deal-tracker
- **Supabase Dashboard**: https://supabase.com/dashboard/project/hutuohivunbneywjuctb

## Environment Variables (Already Set)

All configured in Vercel:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ NEXT_PUBLIC_USER_EMAIL (hyamie@gmail.com)
- ✅ CRON_SECRET

## Features

- Track products from Amazon, Best Buy, Newegg, B&H Photo, Microcenter
- Manual price checks with "Check Price" button
- Automatic daily price checks at 9 AM UTC
- Find alternative vendors with better prices
- View price history and trends
- Set target prices to get notified (in UI)

## Tips

1. **Add Multiple Products**: Build your watchlist
2. **Set Target Prices**: Get highlighted when reached
3. **Check Regularly**: Click "Check All Prices" button
4. **View Alternatives**: See if better deals exist elsewhere

Enjoy your Deal Tracker! 🚀
