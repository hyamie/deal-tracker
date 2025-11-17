#!/bin/bash

# Add environment variables to Vercel
echo "Setting up Vercel environment variables..."

# Supabase URL
echo "https://hutuohivunbneywjuctb.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Supabase Anon Key
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1dHVvaGl2dW5ibmV5d2p1Y3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA5NTksImV4cCI6MjA3NzUwNjk1OX0.uZtQ8uDjbDXELOpuU0xQFcQjmCoNnDamLioYfSCxykY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# User email
echo "hyamie@gmail.com" | vercel env add NEXT_PUBLIC_USER_EMAIL production

# Cron secret
echo "deal-tracker-cron-secret-2025" | vercel env add CRON_SECRET production

echo "Done! Now redeploying..."
