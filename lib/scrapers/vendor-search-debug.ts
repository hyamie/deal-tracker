import { searchAlternativeVendors } from './vendor-search'

/**
 * Debug script to test alternative vendor search
 * Run with: npx tsx lib/scrapers/vendor-search-debug.ts
 */

async function testVendorSearch() {
  console.log('='.repeat(80))
  console.log('Testing Alternative Vendor Search')
  console.log('='.repeat(80))

  const testProducts = [
    {
      name: 'AMD Ryzen 7 7800X3D',
      url: 'https://www.amazon.com/AMD-Ryzen-7800X3D-16-Thread-Processor/dp/B0BTZB7F88',
    },
    {
      name: 'Sony WH-1000XM5 Headphones',
      url: 'https://www.bestbuy.com/site/sony-wh-1000xm5-wireless-noise-canceling-over-the-ear-headphones-black/6505727.p',
    },
    {
      name: 'Apple AirPods Pro',
      url: 'https://www.apple.com/airpods-pro/',
    }
  ]

  for (const product of testProducts) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`Testing: ${product.name}`)
    console.log(`URL: ${product.url}`)
    console.log('='.repeat(80))

    try {
      const startTime = Date.now()
      const alternatives = await searchAlternativeVendors(product.name, product.url, false) // Bypass cache
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)

      console.log(`\nCompleted in ${duration}s`)
      console.log(`Found ${alternatives.length} alternatives:\n`)

      if (alternatives.length > 0) {
        alternatives.forEach((alt, index) => {
          console.log(`${index + 1}. ${alt.retailer}`)
          console.log(`   Price: $${alt.price.toFixed(2)}`)
          console.log(`   URL: ${alt.url}`)
          console.log('')
        })
      } else {
        console.log('❌ NO ALTERNATIVES FOUND')
        console.log('This could be due to:')
        console.log('- Anti-bot protection blocking requests')
        console.log('- Page structure changes (outdated CSS selectors)')
        console.log('- Network/timeout issues')
        console.log('- ScraperAPI rate limiting or errors')
      }

    } catch (error) {
      console.error(`\n❌ ERROR testing ${product.name}:`, error)
    }

    // Wait 3 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log('Testing Complete')
  console.log('='.repeat(80))
}

// Run the test
testVendorSearch().catch(console.error)
