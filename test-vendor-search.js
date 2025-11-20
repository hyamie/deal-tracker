// Test vendor search locally to see what's happening
require('dotenv').config({ path: '.env.local' })

async function testVendorSearch() {
  // Dynamic import for ESM module
  const { searchAlternativeVendors } = await import('./lib/scrapers/vendor-search-serpapi.ts')

  console.log('Testing vendor search for Nintendo Switch...\n')
  console.log('Environment check:')
  console.log('- SERPAPI_KEY:', process.env.SERPAPI_KEY ? 'SET (' + process.env.SERPAPI_KEY.substring(0, 20) + '...)' : 'NOT SET')
  console.log('- SCRAPER_API_KEY:', process.env.SCRAPER_API_KEY ? 'SET' : 'NOT SET')
  console.log('')

  const productName = 'Nintendo Switch 2 + Mario Kart World Bundle'
  const currentUrl = 'https://www.amazon.com/test'

  const results = await searchAlternativeVendors(productName, currentUrl, false)

  console.log(`\n${'='.repeat(80)}`)
  console.log(`FINAL RESULTS: Found ${results.length} alternatives`)
  console.log('='.repeat(80))

  if (results.length > 0) {
    results.forEach((alt, i) => {
      console.log(`${i + 1}. ${alt.retailer}: $${alt.price.toFixed(2)}`)
      console.log(`   ${alt.url}`)
    })
  } else {
    console.log('❌ NO RESULTS FOUND')
  }
}

testVendorSearch().catch(err => {
  console.error('ERROR:', err.message)
  console.error(err.stack)
})
