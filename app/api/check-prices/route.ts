import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { scrapePrice } from '@/lib/scrapers/price-scraper'
import { searchAlternativeVendors } from '@/lib/scrapers/vendor-search'
import { sendPriceDropAlert } from '@/lib/email/send-alert'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId } = body
    const userEmail = request.headers.get('x-user-email') || process.env.USER_EMAIL

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
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('user_email', userEmail)
    .single()

  if (productError) throw productError

  // Scrape current price
  const priceData = await scrapePrice(product.url)
  const oldPrice = product.current_price

  // Update product
  await supabase
    .from('products')
    .update({
      current_price: priceData.price,
      in_stock: priceData.inStock,
      last_checked: new Date().toISOString(),
    })
    .eq('id', productId)

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
  const alternatives = await searchAlternativeVendors(product.name, product.url)

  // Save alternatives
  if (alternatives.length > 0) {
    // Delete old alternatives
    await supabase
      .from('alternative_deals')
      .delete()
      .eq('product_id', productId)

    // Insert new alternatives
    const alternativeRecords = alternatives.map(alt => ({
      product_id: productId,
      retailer: alt.retailer,
      price: alt.price,
      url: alt.url,
    }))

    await supabase.from('alternative_deals').insert(alternativeRecords)
  }

  // Send email alert if price dropped or target reached
  if ((shouldAlert || targetReached) && priceData.price) {
    try {
      await sendPriceDropAlert(
        {
          productName: product.name,
          productUrl: product.url,
          oldPrice,
          newPrice: priceData.price,
          targetPrice: product.target_price,
          imageUrl: product.image_url || undefined,
          alternatives: alternatives.slice(0, 3),
        },
        userEmail
      )
    } catch (emailError) {
      console.error('Error sending email alert:', emailError)
    }
  }

  return {
    product: {
      ...product,
      current_price: priceData.price,
      in_stock: priceData.inStock,
    },
    priceChanged: shouldAlert,
    targetReached,
    alternatives: alternatives.slice(0, 5),
  }
}

async function checkAllProducts(userEmail: string) {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_email', userEmail)

  if (error) throw error

  const results = []

  for (const product of products) {
    try {
      const result = await checkSingleProduct(product.id, userEmail)
      results.push(result)

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error(`Error checking product ${product.id}:`, error)
      results.push({
        product,
        error: 'Failed to check price',
      })
    }
  }

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

    const userEmail = process.env.USER_EMAIL
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
