// @ts-nocheck - Known Supabase TypeScript bug: .update() parameter incorrectly inferred as 'never'
// See: https://github.com/supabase/supabase-js/issues/743
// TODO: Remove when Supabase fixes type inference for .update() with public schema

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { scrapePrice } from '@/lib/scrapers/price-scraper'
import { searchAlternativeVendors } from '@/lib/scrapers/vendor-search'
import type { Product, ProductUpdate, ProductCheckResult, AlternativeVendor } from '@/lib/types'
import { parallelLimit, delay } from '@/lib/parallel'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId } = body
    const userEmail = request.headers.get('x-user-email') || process.env.NEXT_PUBLIC_USER_EMAIL

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 })
    }

    // If productId provided, check single product
    if (productId) {
      const result = await checkSingleProduct(productId, userEmail)
      return NextResponse.json(result)
    }

    // Otherwise check all products
    const results = await checkAllProducts(userEmail)
    return NextResponse.json({ results })

  } catch (error) {
    console.error('Error checking prices:', error)
    return NextResponse.json({ error: 'Failed to check prices' }, { status: 500 })
  }
}

async function checkSingleProduct(productId: string, userEmail: string) {
  // Get product
  const { data, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('user_email', userEmail)
    .single()

  if (productError || !data) throw productError || new Error('Product not found')

  const product: Product = data

  // Scrape current price
  const priceData = await scrapePrice(product.url)
  const oldPrice = product.current_price

  // Update product
  const { error: updateError } = await supabase
    .from('products')
    .update({
      current_price: priceData.price,
      in_stock: priceData.inStock,
      last_checked: new Date().toISOString(),
    })
    .eq('id', productId)

  if (updateError) throw updateError

  // Record price in history
  if (priceData.price) {
    await supabase.from('price_history').insert({
      product_id: productId,
      price: priceData.price,
      url: product.url,
    })
  }

  // Check if price dropped
  const shouldAlert = priceData.price && oldPrice && priceData.price < oldPrice

  // Check if target price reached
  const targetReached = product.target_price && priceData.price && priceData.price <= product.target_price

  // Search for alternatives
  console.log(`Searching for alternatives for product: ${product.name}`)
  const alternatives = await searchAlternativeVendors(product.name, product.url)
  console.log(`Found ${alternatives.length} alternatives:`, alternatives.map(a => `${a.retailer}: $${a.price}`))

  // Save alternatives
  if (alternatives.length > 0) {
    // Delete old alternatives
    const { error: deleteError } = await supabase
      .from('alternative_deals')
      .delete()
      .eq('product_id', productId)

    if (deleteError) {
      console.error('Error deleting old alternatives:', deleteError)
    }

    // Insert new alternatives
    const alternativeRecords = alternatives.map(alt => ({
      product_id: productId,
      retailer: alt.retailer,
      price: alt.price,
      url: alt.url,
    }))

    const { error: insertError } = await supabase.from('alternative_deals').insert(alternativeRecords)

    if (insertError) {
      console.error('Error inserting alternatives:', insertError)
    } else {
      console.log(`Successfully saved ${alternativeRecords.length} alternatives`)
    }
  } else {
    console.log('No alternatives found for this product')
  }

  // Email alerts removed - price changes will show in UI

  const result: ProductCheckResult = {
    product: {
      ...product,
      current_price: priceData.price,
      in_stock: priceData.inStock,
    },
    priceChanged: shouldAlert,
    targetReached,
    alternatives: alternatives.slice(0, 5) as AlternativeVendor[],
  }

  return result
}

async function checkAllProducts(userEmail: string) {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_email', userEmail)

  if (error) throw error

  // Use parallel processing with concurrency limit (3 simultaneous requests)
  const tasks = products.map(product => async () => {
    try {
      const result = await checkSingleProduct(product.id, userEmail)
      // Small delay between checks to avoid overwhelming APIs
      await delay(500)
      return result
    } catch (error) {
      console.error(`Error checking product ${product.id}:`, error)
      return {
        product,
        error: 'Failed to check price',
      }
    }
  })

  // Execute tasks in parallel with concurrency limit of 3
  const results = await parallelLimit(tasks, 3)

  return results
}

// GET route for cron jobs
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    // Verify cron secret
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = process.env.NEXT_PUBLIC_USER_EMAIL
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not configured' }, { status: 500 })
    }

    const results = await checkAllProducts(userEmail)

    return NextResponse.json({
      success: true,
      checked: results.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in cron job:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
