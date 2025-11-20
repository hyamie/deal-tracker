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
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_shopping',
        q: query,
        api_key: apiKey,
        num: 10, // Get top 10 results
      },
      timeout: 15000,
    })

    const results: AlternativeVendor[] = []
    const shoppingResults = response.data.shopping_results || []

    shoppingResults.forEach((item: any) => {
      // Skip if it's from the same retailer
      if (item.link && item.link.includes(excludeHostname)) {
        return
      }

      const price = item.price || item.extracted_price
      const source = item.source || 'Unknown Retailer'
      const link = item.link

      if (price && link) {
        results.push({
          retailer: source,
          price: typeof price === 'number' ? price : parseFloat(price.toString().replace(/[^0-9.]/g, '')),
          url: link,
        })
      }
    })

    console.log(`SerpApi: Found ${results.length} results`)
    return results.slice(0, 5) // Limit to top 5

  } catch (error: any) {
    if (error.response?.status === 429) {
      console.error('SerpApi rate limit exceeded - you may have used your 100 free searches this month')
    } else {
      console.error('Error searching Google Shopping via SerpApi:', error.message)
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
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sop=15&LH_BIN=1` // Buy It Now only, sorted by price

    // Use ScraperAPI if available, otherwise direct request
    const scraperApiKey = process.env.SCRAPER_API_KEY
    const finalUrl = scraperApiKey
      ? `https://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(searchUrl)}&render=true`
      : searchUrl

    const response = await axios.get(finalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 20000,
    })

    // Try to parse JSON-LD structured data first (more reliable)
    const jsonLdMatch = response.data.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)
    const results: AlternativeVendor[] = []

    if (jsonLdMatch) {
      jsonLdMatch.forEach((script: string) => {
        try {
          const json = JSON.parse(script.replace(/<script[^>]*>|<\/script>/g, ''))
          if (json['@type'] === 'Product' && json.offers) {
            const price = parseFloat(json.offers.price)
            const url = json.offers.url
            if (!isNaN(price) && url) {
              results.push({
                retailer: 'eBay',
                price,
                url,
              })
            }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      })
    }

    // Fallback to HTML parsing if JSON-LD didn't work
    if (results.length === 0) {
      const cheerio = await import('cheerio')
      const $ = cheerio.load(response.data)

      $('.s-item').slice(0, 5).each((_, element) => {
        const $elem = $(element)
        const priceText = $elem.find('.s-item__price').first().text()
        const url = $elem.find('.s-item__link').attr('href')

        if (priceText && url) {
          const match = priceText.match(/[\d,]+\.?\d*/)
          if (match) {
            const price = parseFloat(match[0].replace(/,/g, ''))
            if (!isNaN(price)) {
              results.push({
                retailer: 'eBay',
                price,
                url,
              })
            }
          }
        }
      })
    }

    console.log(`eBay: Found ${results.length} results`)
    return results.slice(0, 5)

  } catch (error) {
    console.error('Error searching eBay:', error)
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
