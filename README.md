# Deal Tracker

A powerful price tracking app that monitors your favorite products across multiple retailers and alerts you when prices drop or reach your target price.

## Features

- Multi-Retailer Support: Track products from Amazon, Best Buy, Newegg, B&H Photo, Microcenter, and more
- Price Alerts: Get email notifications when prices drop or reach your target
- Alternative Vendor Search: Automatically finds better deals from other retailers
- Price History: View price trends over time
- Manual & Automatic Checks: Check prices on demand or automatically via daily cron jobs
- Beautiful UI: Modern, responsive design with Tailwind CSS

## Tech Stack

- Frontend: Next.js 15, React, TypeScript, Tailwind CSS
- Backend: Next.js API Routes
- Database: Supabase (PostgreSQL)
- Price Scraping: Cheerio, Axios
- Email: Resend
- Deployment: Vercel (with cron jobs)

## Setup Instructions

### 1. Install Dependencies

```bash
cd C:/ClaudeAgents/projects/deal-tracker
npm install
```

### 2. Set Up Supabase

1. Go to supabase.com and create a new project (free tier)
2. Once created, go to Settings > API to get your credentials
3. Go to SQL Editor and run the schema from supabase-schema.sql

### 3. Set Up Resend (Email)

1. Go to resend.com and sign up (free tier: 3k emails/month)
2. Create an API key
3. Add your domain or use their test domain for development

### 4. Configure Environment Variables

Create .env.local file:

```bash
cp .env.local.example .env.local
```

Edit .env.local with your credentials

### 5. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 6. Deploy to Vercel

1. Push your code to GitHub
2. Go to vercel.com and import your repository
3. Add all environment variables from .env.local
4. Deploy!

The cron job will automatically run daily at 9 AM to check all prices.

## Usage

### Adding Products

1. Click "Add New Product"
2. Enter product name, URL, and optional target price
3. The app will scrape the current price and find alternative vendors

### Checking Prices

- Single Product: Click "Check Price" on any product card
- All Products: Click "Check All Prices" button
- Automatic: Cron job runs daily at 9 AM

### Email Alerts

You'll receive emails when:
- Price drops below the previous price
- Price reaches or goes below your target price
- Better deals are found at alternative vendors

## Supported Retailers

- Amazon
- Best Buy
- Newegg
- B&H Photo Video
- Microcenter
- Generic sites with meta tags

Plus deal aggregators:
- Slickdeals
- DealNews
- Google Shopping
