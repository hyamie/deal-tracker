// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { scrapePrice, getRetailerName } from '@/lib/scrapers/price-scraper'
import { searchAlternativeVendors } from '@/lib/scrapers/vendor-search'

// GET all products
export async function GET(request: NextRequest) {
  try {
    const userEmail = request.headers.get('x-user-email') || process.env.NEXT_PUBLIC_USER_EMAIL

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 })
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url, targetPrice } = body
    const userEmail = request.headers.get('x-user-email') || process.env.NEXT_PUBLIC_USER_EMAIL

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 })
    }

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL required' }, { status: 400 })
    }

    // Scrape initial price
    console.log('Scraping initial price for:', url)
    const priceData = await scrapePrice(url)

    // Get retailer name
    const retailer = getRetailerName(url)

    // Insert product
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert({
        name,
        url,
        current_price: priceData.price,
        target_price: targetPrice || null,
        image_url: priceData.imageUrl,
        retailer,
        in_stock: priceData.inStock,
        last_checked: new Date().toISOString(),
        user_email: userEmail,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Record initial price in history
    if (priceData.price) {
      await supabase.from('price_history').insert({
        product_id: product.id,
        price: priceData.price,
        url,
      })
    }

    // Search for alternative vendors in background
    if (priceData.price) {
      searchAlternativeVendors(name, url)
        .then(async (alternatives) => {
          if (alternatives.length > 0) {
            const alternativeRecords = alternatives.map(alt => ({
              product_id: product.id,
              retailer: alt.retailer,
              price: alt.price,
              url: alt.url,
            }))

            await supabase.from('alternative_deals').insert(alternativeRecords)
          }
        })
        .catch(err => console.error('Error finding alternatives:', err))
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product', details: error.message }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

// DELETE product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
