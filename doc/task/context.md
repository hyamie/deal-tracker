# Deal Tracker - Project Context

**Project Name:** Deal Tracker
**Status:** ✅ Active - Phase 1 Complete, Phase 2 In Progress
**Last Updated:** 2025-11-18

## Current Goal

Build a smart price tracking app that monitors product prices across retailers and alerts users when prices drop or better deals are found.

## Architecture Overview

### Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes (serverless)
- **Database:** Supabase PostgreSQL (public schema)
- **Price Scraping:** ScraperAPI + Cheerio
- **Deployment:** Vercel (planned)

### Key Components
1. **Product Tracking** - Monitor URLs, current prices, target prices
2. **Price History** - Track price changes over time
3. **Alternative Vendors** - Find better deals on other sites
4. **Cron Jobs** - Automated price checking via Vercel cron

## Recent Changes

### 2025-11-18: Database Schema Migration (CRITICAL FIX)
**Why:** Fixed PGRST106 error blocking all API calls
**What Changed:**
- Migrated from `deal_tracker` schema to `public` schema
- Updated Supabase client configuration
- Updated TypeScript types (Database['public'])
- Fixed cron job environment variables
- Created migration SQL and verification script

**Outcome:** API working, 3 products tracked, 8 price records migrated

### 2025-11-18: Code Quality Improvements (IN PROGRESS)
**Why:** Remove @ts-nocheck, improve type safety, better maintainability
**What Changed:**
- Created shared type definitions (`lib/types.ts`)
- Removed @ts-nocheck from all API routes
- Added proper TypeScript types throughout
- Created database documentation
- Organized migration files

**Outcome:** Clean TypeScript, no type errors, better DX

## Current State

### What's Working
✅ Database connectivity (public schema)
✅ Product CRUD operations
✅ Price scraping (ScraperAPI)
✅ Price history tracking
✅ Alternative vendor search
✅ API routes fully typed

### Known Issues
⚠️ No caching for price scraping (slow, expensive)
⚠️ Sequential product checking (slow for multiple products)
⚠️ No rate limiting on API calls
⚠️ Alternative vendor caching not optimized

### Next Steps (Phase 3)
1. Implement price scraping cache (Redis or Supabase cache)
2. Add batch parallel product checking
3. Smart alternative vendor caching
4. Rate limiting improvements

## Key Decisions

### Decision: Use Public Schema Instead of Custom Schema
**When:** 2025-11-18
**Why:** Supabase REST API only supports `public` and `graphql_public` schemas by default
**Reasoning:** PGRST106 error was blocking all API calls. Custom schemas require PostgREST configuration changes not available in Supabase Cloud.
**Alternatives Considered:**
- Keep custom schema (would require self-hosted PostgREST)
- Use GraphQL API (overkill for simple CRUD)

**Result:** Migration to public schema, all APIs working

### Decision: Remove @ts-nocheck
**When:** 2025-11-18
**Why:** Improve type safety, catch errors at compile time
**Reasoning:** @ts-nocheck was hiding type errors that could cause runtime bugs
**Alternatives Considered:**
- Keep @ts-nocheck (lazy, error-prone)
- Gradual migration (slower)

**Result:** Full type coverage, no type errors, better IDE support

## Team Preferences

### Coding Style
- TypeScript strict mode
- Shared types in `lib/types.ts`
- Conventional commits (fix:, feat:, docs:, chore:)
- Detailed commit messages with context

### Database
- Public schema for all tables
- RLS enabled (allow-all for dev)
- Indexed foreign keys
- Timestamps on all tables

### API Routes
- NextRequest/NextResponse types
- Proper error handling with typed responses
- User email from header or env
- Consistent response format

## Dependencies

### Core
- Next.js 16 + React 19
- @supabase/supabase-js ^2.81.1
- axios ^1.13.2
- cheerio ^1.1.2

### External Services
- **Supabase:** PostgreSQL database (project: isjvcytbwanionrtvplq)
- **ScraperAPI:** Price scraping (API key in .env.local)
- **Vercel:** Hosting + cron jobs (planned)

## Notes for Agents

### When Working on This Project
1. Always read `doc/task/context.md` first
2. Use types from `lib/types.ts`
3. Never use `deal_tracker` schema (use `public`)
4. Test API endpoints after changes
5. Update this context file when making changes

### Database Access
- Supabase URL: `https://isjvcytbwanionrtvplq.supabase.co`
- Schema: `public` (NOT `deal_tracker`)
- User email: `mikehyamsjr@gmail.com`

### Common Tasks
- Add product: POST `/api/products`
- Check prices: POST `/api/check-prices`
- Get history: GET `/api/products/[id]`
- Cron trigger: GET `/api/check-prices` (with Bearer token)

### Performance Notes
- ScraperAPI costs $1 per 1000 requests
- Price checking takes ~2-5 seconds per product
- Alternative vendor search takes ~5-10 seconds
- Need caching to reduce costs and improve speed

---

**Last Agent:** Donnie (Meta-Orchestrator)
**Last Session:** 2025-11-18 (Database migration + code quality)
**Next Session:** Continue with Phase 3 (caching + performance)
