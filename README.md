# Deal Tracker

Track product prices across multiple retailers and get notified when deals go live!

## Features

- Track products from Amazon, Best Buy, Newegg, B&H Photo, Microcenter
- Manual price checking on demand
- Automatic daily price checks via Vercel cron jobs
- Find alternative vendors with better prices
- Price history tracking
- Beautiful responsive UI

## Quick Start

### 1. Set Up Supabase Database

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to SQL Editor and run the schema from `supabase-schema.sql`
4. Get your credentials from Settings > API

### 2. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_USER_EMAIL=your_email@example.com
CRON_SECRET=your_random_string
```

### 3. Install and Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

### 4. Deploy to Vercel

```bash
# Push to GitHub
git remote add origin https://github.com/yourusername/deal-tracker.git
git branch -M main
git push -u origin main
```

Then:
1. Go to https://vercel.com
2. Import your repository
3. Add environment variables
4. Deploy!

## Tech Stack

- Next.js 15 + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Vercel (hosting + cron jobs)

## License

MIT
