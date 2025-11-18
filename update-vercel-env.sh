#!/bin/bash

# Remove old environment variables
echo "Removing old Vercel environment variables..."
vercel env rm NEXT_PUBLIC_SUPABASE_URL production --yes 2>/dev/null || true
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes 2>/dev/null || true
vercel env rm NEXT_PUBLIC_USER_EMAIL production --yes 2>/dev/null || true
vercel env rm CRON_SECRET production --yes 2>/dev/null || true

# Add new environment variables
echo "Adding updated Vercel environment variables..."

# Supabase URL
echo "https://isjvcytbwanionrtvplq.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Supabase Anon Key
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzanZjeXRid2FuaW9ucnR2cGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4Njk5NjcsImV4cCI6MjA0NzQ0NTk2N30.gvy84t-ws5ak7eMGLOAf_L-xa72ls6e9RkFJvSNYpWM" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Supabase Schema
echo "deal_tracker" | vercel env add NEXT_PUBLIC_SUPABASE_SCHEMA production

# User email
echo "hyamie@gmail.com" | vercel env add NEXT_PUBLIC_USER_EMAIL production

# Cron secret
echo "deal-tracker-cron-secret-2025" | vercel env add CRON_SECRET production

echo "Done! Environment variables updated."
