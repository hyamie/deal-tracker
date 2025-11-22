# Deal Tracker - Project Status

## Last Updated: 2025-11-22

## Project Overview
A Next.js application for tracking product prices across retailers, finding better deals, and monitoring price history.

**Live URL**: https://deal-tracker-49vdkk1ww-mike-hyams-projects.vercel.app
**GitHub**: https://github.com/hyamie/deal-tracker
**Database**: Supabase (project: isjvcytbwanionrtvplq)

## Recent Updates (Nov 22, 2025)

### 1. Fixed "Check All Prices" Bug
**Issue**: The "Check All Prices" button was returning errors while individual price checks worked fine.

**Root Cause**: Bug in `lib/parallel.ts` - the `parallelLimit` function had faulty promise tracking logic:
- Used array with broken `splice()` logic to remove completed promises
- Promise comparison `p === promise` didn't work correctly
- Caused executing array to grow indefinitely and crash

**Fix**:
- Replaced array with `Set<Promise<void>>` for tracking executing promises
- Added `.finally()` handler to auto-remove promises when complete
- Now properly respects concurrency limit (3 simultaneous requests)

**Files Changed**:
- `lib/parallel.ts` - Complete rewrite of parallelLimit function

### 2. Added Price History Tracking Feature
**What It Does**: Shows historical price changes for each product with visual indicators

**Features**:
- 📊 Collapsible price history view on each product card
- 📉 Green indicator when price drops
- 📈 Red indicator when price increases
- "LOWEST" badge highlights best price ever recorded
- Shows price differences (↓/↑ $X.XX) between checks
- Displays last 30 price checks with timestamps
- Scrollable view for better UX
- Auto-refreshes after each price check

**Files Added**:
- `app/api/price-history/route.ts` - API endpoint to fetch price history

**Files Modified**:
- `components/ProductCard.tsx` - Added price history UI section
- Imports PriceHistory type
- New state: `priceHistory`, `showHistory`
- New function: `fetchPriceHistory()`
- Integrated into `handleCheck()` to refresh after price updates

## Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Web Scraping**: ScraperAPI + SerpAPI
- **Price Checking**: Parallel processing with concurrency control

## Database Schema

### Tables:
1. **products**
   - id, name, url, current_price, target_price
   - image_url, category, retailer
   - last_checked, in_stock, user_email
   - created_at, updated_at

2. **price_history**
   - id, product_id, price, checked_at, url
   - Stores historical price data (limit: 30 per query)

3. **alternative_deals**
   - id, product_id, retailer, price, url, found_at
   - Stores alternative vendor pricing

## Key Features
- ✅ Add products by URL with automatic price scraping
- ✅ Set target prices for alerts
- ✅ Individual product price checking
- ✅ Bulk "Check All Prices" (parallel processing)
- ✅ Price history tracking with visual indicators
- ✅ Alternative vendor search via SerpAPI
- ✅ Automatic daily price checks (cron job at 9 AM)
- ✅ Visual indicators for price status (target reached, drops, increases)

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=https://isjvcytbwanionrtvplq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
NEXT_PUBLIC_USER_EMAIL=mikehyamsjr@gmail.com
SCRAPER_API_KEY=[your-scraper-api-key]
SERPAPI_API_KEY=[your-serpapi-key]
CRON_SECRET=[your-cron-secret]
```

## API Endpoints

### Products
- `GET /api/products` - Fetch all products for user
- `POST /api/products` - Add new product
- `PATCH /api/products/[id]` - Update product
- `DELETE /api/products?id={id}` - Delete product

### Price Checking
- `POST /api/check-prices` - Check prices
  - With `productId`: Check single product
  - Without `productId`: Check all products (parallel)
- `GET /api/check-prices` - Cron job endpoint (requires Bearer token)

### Price History
- `GET /api/price-history?productId={id}` - Fetch last 30 price checks

## Known Issues & Limitations
- ScraperAPI has rate limits - parallel checking limited to 3 concurrent requests
- Some websites may block scraping attempts
- Price history limited to 30 entries per product
- Daily cron job timing is fixed at 9 AM

## Future Enhancement Ideas
- Add price charts/graphs for better visualization
- Email notifications for price drops
- Support for more retailers
- Price prediction based on history
- Export price history to CSV
- Mobile app version
- Browser extension for quick adds
- Price drop percentage calculations
- Compare prices across time periods

## Deployment Notes
- Auto-deploys to Vercel on git push to master
- GitHub repo: hyamie/deal-tracker
- Uses Vercel production environment
- Database hosted on Supabase free tier

## File Structure
```
deal-tracker/
├── app/
│   ├── api/
│   │   ├── check-prices/route.ts
│   │   ├── price-history/route.ts
│   │   └── products/
│   ├── layout.tsx
│   └── page.tsx (main dashboard)
├── components/
│   ├── ProductCard.tsx (price history UI)
│   └── AddProductForm.tsx
├── lib/
│   ├── parallel.ts (FIXED - concurrency control)
│   ├── supabase.ts
│   ├── types.ts
│   ├── database.types.ts
│   └── scrapers/
│       ├── price-scraper.ts
│       └── vendor-search-serpapi.ts
└── database/
    └── [schema files]
```

## Recent Commits
1. `fix: Correct parallelLimit concurrency control in check all prices` (b1a8a51)
   - Fixed Set-based promise tracking
   - Removed buggy splice logic

2. `feat: Add price history tracking with visual indicators` (1999b06)
   - Added /api/price-history endpoint
   - Price history UI in ProductCard
   - Visual price change indicators

## Testing Checklist
- [x] Individual product price check works
- [x] Check all prices works (parallel processing)
- [x] Price history displays correctly
- [x] Price drop indicators show
- [x] Lowest price badge highlights correctly
- [x] Price differences calculate accurately
- [x] Alternative deals still work
- [x] Target price alerts work
- [x] Product CRUD operations work

## Contact
User: Mike Hyam (mikehyamsjr@gmail.com)
Project Manager: Claude Code (Donnie profile)
