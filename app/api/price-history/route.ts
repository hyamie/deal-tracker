import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('product_id', productId)
      .order('checked_at', { ascending: false })
      .limit(30) // Last 30 price checks

    if (error) throw error

    return NextResponse.json({ history: data || [] })

  } catch (error) {
    console.error('Error fetching price history:', error)
    return NextResponse.json({ error: 'Failed to fetch price history' }, { status: 500 })
  }
}
