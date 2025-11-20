import axios from 'axios'
import { cache, cacheKeys } from '../cache'

export interface AlternativeVendor {
  retailer: string
  price: number
  url: string
}

/**
 * Search for alternative vendors using SerpApi (100 free searches/month)
 * Much more reliable than web scraping with zero cost for personal use
 *
 * Setup:
 * 1. Sign up at https://serpapi.com (no credit card required)
 * 2. Get your API key from dashboard
 * 3. Add SERPAPI_KEY to .env.local
 */
export async function searchAlternativeVendors(
  productName: string,
  currentUrl: string,
  useCache: boolean = true
): Promise<AlternativeVendor[]> {
  // Check cache first (24 hour TTL to minimize API calls)
  const cacheKey = cacheKeys.alternatives(productName, currentUrl)
  if (useCache) {
    const cached = cache.get<AlternativeVendor[]>(cacheKey)
    if (cached) {
      console.log(`[Cache HIT] Alternative vendors for: ${productName}`)
      return cached
    }
  }

  console.log(`[Cache MISS] Searching alternative vendors for: ${productName}`)
  const alternatives: AlternativeVendor[] = []

  try {
    const searchQuery = cleanProductName(productName)
    const currentHostname = new URL(currentUrl).hostname

    // Try SerpApi first (if API key is configured)
    const serpApiKey = process.env.SERPAPI_KEY
    if (serpApiKey) {
      console.log('Using SerpApi for Google Shopping results...')
      const serpResults = await searchGoogleShoppingSerpApi(searchQuery, currentHostname, serpApiKey)
      alternatives.push(...serpResults)
    } else {
      console.log('⚠️  SERPAPI_KEY not configured - skipping Google Shopping')
      console.log('   Sign up at https://serpapi.com for 100 free searches/month')
    }

    // Always try eBay as backup (scraping still works reasonably well)
    console.log('Searching eBay...')
    const ebayResults = await searchEbay(searchQuery)
    alternatives.push(...ebayResults)

    // Remove duplicates and sort by price
    const uniqueAlternatives = removeDuplicates(alternatives)
    console.log(`Total unique alternatives found: ${uniqueAlternatives.length}`)
    const sortedAlternatives = uniqueAlternatives.sort((a, b) => a.price - b.price)

    // Cache the results (24 hour TTL to minimize API usage)
    if (useCache && sortedAlternatives.length > 0) {
      cache.set(cacheKey, sortedAlternatives, 1000 * 60 * 60 * 24) // 24 hours
      console.log(`[Cache SET] Cached ${sortedAlternatives.length} alternative vendors for: ${productName}`)
    }

    return sortedAlternatives

  } catch (error) {
    console.error('Error searching alternative vendors:', error)
    return []
  }
}

function cleanProductName(name: string): string {
  return name
    .replace(/\(.*?\)/g, '') // Remove parentheses content
    .replace(/\[.*?\]/g, '') // Remove bracket content
    .replace(/\b(new|used|refurbished|open box)\b/gi, '')
    .trim()
}

/**
 * Search Google Shopping using SerpApi
 * Free tier: 100 searches/month
 * Response time: ~5 seconds
 */
async function searchGoogleShoppingSerpApi(
  query: string,
  excludeHostname: string,
  apiKey: string
): Promise<AlternativeVendor[]> {
  try {
    console.log(`[SerpApi] Searching Google Shopping for: "${query}"`)

    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_shopping',
        q: query,
        api_key: apiKey,
        num: 20, // Get more results (increased from 10)
      },
      timeout: 15000,
    })

    const results: AlternativeVendor[] = []
    const shoppingResults = response.data.shopping_results || []

    console.log(`[SerpApi] Raw response: ${shoppingResults.length} shopping results returned`)

    if (shoppingResults.length === 0) {
      console.log(`[SerpApi] No results found. This could mean:`)
      console.log(`  - Product is niche/not widely sold`)
      console.log(`  - Search query too specific`)
      console.log(`  - Try a shorter/simpler search term`)
    }

    shoppingResults.forEach((item: any, index: number) => {
      // Skip if it's from the same retailer
      if (item.link && item.link.includes(excludeHostname)) {
        console.log(`[SerpApi] Skipping result ${index + 1}: Same retailer (${excludeHostname})`)
        return
      }

      const price = item.price || item.extracted_price
      const source = item.source || 'Unknown Retailer'
      const link = item.link

      if (price && link) {
        const priceNum = typeof price === 'number' ? price : parseFloat(price.toString().replace(/[^0-9.]/g, ''))
        if (!isNaN(priceNum)) {
          results.push({
            retailer: source,
            price: priceNum,
            url: link,
          })
          console.log(`[SerpApi] Result ${results.length}: ${source} - $${priceNum.toFixed(2)}`)
        }
      }
    })

    console.log(`[SerpApi] Successfully parsed ${results.length} valid alternatives`)
    return results.slice(0, 10) // Return more results (increased from 5)

  } catch (error: any) {
    if (error.response?.status === 429) {
      console.error('[SerpApi] ❌ Rate limit exceeded - you may have used your 100 free searches this month')
    } else if (error.response?.data) {
      console.error('[SerpApi] ❌ API Error:', JSON.stringify(error.response.data, null, 2))
    } else {
      console.error('[SerpApi] ❌ Error:', error.message)
    }
    return []
  }
}

/**
 * Search eBay - still works reasonably well with scraping
 * No API key needed
 */
async function searchEbay(query: string): Promise<AlternativeVendor[]> {
  try {
    console.log(`[eBay] Searching for: "${query}"`)
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sop=15&LH_BIN=1` // Buy It Now only, sorted by price

    // Use ScraperAPI if available, otherwise direct request
    const scraperApiKey = process.env.SCRAPER_API_KEY
    const finalUrl = scraperApiKey
      ? `https://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(searchUrl)}&render=true`
      : searchUrl

    console.log(`[eBay] Using ${scraperApiKey ? 'ScraperAPI' : 'direct request'}`)

    const response = await axios.get(finalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 20000,
    })

    const results: AlternativeVendor[] = []

    // Load the HTML with cheerio
    const cheerio = await import('cheerio')
    const $ = cheerio.load(response.data)

    console.log(`[eBay] Page loaded, parsing results...`)

    // Parse eBay listings
    let itemCount = 0
    $('.s-item').each((index, element) => {
      // Skip the first item (usually a placeholder/ad)
      if (index === 0) return
      if (results.length >= 10) return // Limit to 10 results

      const $elem = $(element)
      const priceText = $elem.find('.s-item__price').first().text()
      const url = $elem.find('.s-item__link').attr('href')
      const title = $elem.find('.s-item__title').text()

      itemCount++

      if (priceText && url) {
        // Handle price ranges (e.g., "$10 to $20") - take the lower price
        const match = priceText.match(/\$?([\d,]+\.?\d*)/)
        if (match) {
          const price = parseFloat(match[1].replace(/,/g, ''))
          if (!isNaN(price) && price > 0) {
            results.push({
              retailer: 'eBay',
              price,
              url: url.split('?')[0], // Remove tracking parameters
            })
            console.log(`[eBay] Result ${results.length}: $${price.toFixed(2)} - ${title.substring(0, 50)}...`)
          }
        }
      }
    })

    console.log(`[eBay] Parsed ${itemCount} items, found ${results.length} valid results`)

    if (results.length === 0) {
      console.log(`[eBay] No results found. This could mean:`)
      console.log(`  - Product is very niche or not sold on eBay`)
      console.log(`  - Page structure changed (scraper needs update)`)
      console.log(`  - eBay blocked the request`)
    }

    return results.slice(0, 10)

  } catch (error: any) {
    console.error('[eBay] ❌ Error:', error.message)
    if (error.response?.status) {
      console.error(`[eBay] HTTP Status: ${error.response.status}`)
    }
    return []
  }
}

function removeDuplicates(alternatives: AlternativeVendor[]): AlternativeVendor[] {
  const seen = new Set<string>()
  return alternatives.filter(alt => {
    const key = `${alt.retailer}-${alt.price}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
