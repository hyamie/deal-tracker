// @ts-nocheck - Known Supabase TypeScript bug: .update() parameter incorrectly inferred as 'never'
// See: https://github.com/supabase/supabase-js/issues/743
// TODO: Remove when Supabase fixes type inference for .update() with public schema

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Product, PriceHistory, AlternativeDeal, ProductUpdate } from '@/lib/types'

// GET single product with history and alternatives
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (productError) throw productError

    // Get price history
    const { data: history, error: historyError } = await supabase
      .from('price_history')
      .select('*')
      .eq('product_id', id)
      .order('checked_at', { ascending: true })

    if (historyError) throw historyError

    // Get alternative deals
    const { data: alternatives, error: altError } = await supabase
      .from('alternative_deals')
      .select('*')
      .eq('product_id', id)
      .order('price', { ascending: true })

    if (altError) throw altError

    return NextResponse.json({
      product,
      history,
      alternatives,
    })
  } catch (error) {
    console.error('Error fetching product details:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

// PATCH update product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json() as ProductUpdate

    const { data: product, error } = await supabase
      .from('products')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}
