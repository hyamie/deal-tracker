#!/usr/bin/env node

/**
 * Migration Script: Move tables from deal_tracker schema to public schema
 * This fixes the PGRST106 error by using Supabase's default 'public' schema
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

console.log(`🔗 Connecting to Supabase: ${supabaseUrl}`)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runMigration() {
  try {
    console.log('📋 Reading migration SQL...')
    const sqlPath = path.join(__dirname, '..', 'database', 'migrate-to-public-schema.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    console.log('🚀 Executing migration...')
    console.log('   This will:')
    console.log('   1. Create tables in public schema')
    console.log('   2. Create indexes')
    console.log('   3. Enable RLS')
    console.log('   4. Copy data from deal_tracker schema (if exists)')
    console.log('')

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))

    console.log(`📝 Executing ${statements.length} SQL statements...`)

    // Execute via RPC (this requires creating a stored procedure)
    // Since we can't execute raw SQL directly via the API, we'll use a different approach

    console.log('')
    console.log('⚠️  MANUAL MIGRATION REQUIRED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('Please run the migration SQL manually:')
    console.log('')
    console.log('1. Go to: https://supabase.com/dashboard/project/isjvcytbwanionrtvplq/editor')
    console.log('2. Open the SQL Editor')
    console.log('3. Copy and paste the contents of:')
    console.log(`   ${sqlPath}`)
    console.log('4. Click "Run"')
    console.log('')
    console.log('This will create the tables in the public schema and migrate any existing data.')
    console.log('')

    // Verify tables exist in public schema
    console.log('🔍 Checking if tables already exist in public schema...')

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    if (!productsError) {
      console.log('✅ Products table exists in public schema')
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      console.log(`   Found ${count} products`)
    } else {
      console.log('❌ Products table not found in public schema')
      console.log(`   Error: ${productsError.message}`)
    }

    const { data: priceHistory, error: priceHistoryError } = await supabase
      .from('price_history')
      .select('id')
      .limit(1)

    if (!priceHistoryError) {
      console.log('✅ Price history table exists in public schema')
      const { count } = await supabase
        .from('price_history')
        .select('*', { count: 'exact', head: true })
      console.log(`   Found ${count} price records`)
    } else {
      console.log('❌ Price history table not found in public schema')
      console.log(`   Error: ${priceHistoryError.message}`)
    }

    const { data: alternatives, error: alternativesError } = await supabase
      .from('alternative_deals')
      .select('id')
      .limit(1)

    if (!alternativesError) {
      console.log('✅ Alternative deals table exists in public schema')
      const { count } = await supabase
        .from('alternative_deals')
        .select('*', { count: 'exact', head: true })
      console.log(`   Found ${count} alternative deals`)
    } else {
      console.log('❌ Alternative deals table not found in public schema')
      console.log(`   Error: ${alternativesError.message}`)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
