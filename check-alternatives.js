// Quick diagnostic script to check if alternatives are in the database
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://isjvcytbwanionrtvplq.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzanZjeXRid2FuaW9ucnR2cGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNjgxMDIsImV4cCI6MjA3ODc0NDEwMn0.q1W__SM-pHCAkYAMBKbxDPTyeXxCHBCBn1T8Spb4hAE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAlternatives() {
  console.log('Checking for alternative deals in database...\n')

  // Get all products
  const { data: products } = await supabase.from('products').select('id, name')
  const productCount = products ? products.length : 0
  console.log(`Found ${productCount} products\n`)

  // Check alternatives for each product
  if (products) {
    for (const product of products) {
      const { data: alternatives } = await supabase
        .from('alternative_deals')
        .select('*')
        .eq('product_id', product.id)

      const altCount = alternatives ? alternatives.length : 0
      console.log(`Product: ${product.name}`)
      console.log(`  Alternatives in DB: ${altCount}`)
      if (alternatives && alternatives.length > 0) {
        alternatives.forEach(alt => {
          console.log(`    - ${alt.retailer}: $${alt.price}`)
        })
      }
      console.log('')
    }
  }
}

checkAlternatives().catch(console.error)
