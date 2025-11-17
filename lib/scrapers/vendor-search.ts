import axios from 'axios'
import * as cheerio from 'cheerio'

export interface AlternativeVendor {
  retailer: string
  price: number
  url: string
}

export async function searchAlternativeVendors(productName: string, currentUrl: string): Promise<AlternativeVendor[]> {
  const alternatives: AlternativeVendor[] = []

  try {
    // Clean up product name for searching
    const searchQuery = cleanProductName(productName)

    // Search Google Shopping
    const googleResults = await searchGoogleShopping(searchQuery, currentUrl)
    alternatives.push(...googleResults)

    // Search Slickdeals
    const slickdealsResults = await searchSlickdeals(searchQuery)
    alternatives.push(...slickdealsResults)

    // Remove duplicates and sort by price
    const uniqueAlternatives = removeDuplicates(alternatives)
    return uniqueAlternatives.sort((a, b) => a.price - b.price)

  } catch (error) {
    console.error('Error searching alternative vendors:', error)
    return []
  }
}

function cleanProductName(name: string): string {
  // Remove common words and clean up for better search results
  return name
    .replace(/\(.*?\)/g, '') // Remove parentheses content
    .replace(/\[.*?\]/g, '') // Remove bracket content
    .replace(/\b(new|used|refurbished|open box)\b/gi, '')
    .trim()
}

async function searchGoogleShopping(query: string, excludeUrl: string): Promise<AlternativeVendor[]> {
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop`
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    })

    const $ = cheerio.load(response.data)
    const results: AlternativeVendor[] = []

    // Parse Google Shopping results
    $('.sh-dgr__content').each((_, element) => {
      const $elem = $(element)
      const priceText = $elem.find('.a8Pemb').text()
      const url = $elem.find('a').attr('href')
      const retailer = $elem.find('.aULzUe').text() || $elem.find('.shntl').text()

      if (priceText && url && !url.includes(new URL(excludeUrl).hostname)) {
        const match = priceText.match(/[\d,]+\.?\d*/)
        if (match) {
          const price = parseFloat(match[0].replace(/,/g, ''))
          results.push({
            retailer: retailer || 'Unknown',
            price,
            url: url.startsWith('http') ? url : `https://google.com${url}`,
          })
        }
      }
    })

    return results.slice(0, 5) // Limit to top 5 results

  } catch (error) {
    console.error('Error searching Google Shopping:', error)
    return []
  }
}

async function searchSlickdeals(query: string): Promise<AlternativeVendor[]> {
  try {
    const searchUrl = `https://slickdeals.net/newsearch.php?firstonly=1&q=${encodeURIComponent(query)}`
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    })

    const $ = cheerio.load(response.data)
    const results: AlternativeVendor[] = []

    // Parse Slickdeals results
    $('.fpItem').slice(0, 3).each((_, element) => {
      const $elem = $(element)
      const priceText = $elem.find('.itemPrice').text()
      const url = $elem.find('.itemTitle a').attr('href')
      const retailer = $elem.find('.itemStore').text()

      if (priceText && url) {
        const match = priceText.match(/[\d,]+\.?\d*/)
        if (match) {
          const price = parseFloat(match[0].replace(/,/g, ''))
          results.push({
            retailer: retailer || 'Slickdeals',
            price,
            url: url.startsWith('http') ? url : `https://slickdeals.net${url}`,
          })
        }
      }
    })

    return results

  } catch (error) {
    console.error('Error searching Slickdeals:', error)
    return []
  }
}

async function searchDealNews(query: string): Promise<AlternativeVendor[]> {
  try {
    const searchUrl = `https://www.dealnews.com/search/?q=${encodeURIComponent(query)}`
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    })

    const $ = cheerio.load(response.data)
    const results: AlternativeVendor[] = []

    // Parse DealNews results
    $('.deal-item').slice(0, 3).each((_, element) => {
      const $elem = $(element)
      const priceText = $elem.find('.price').text()
      const url = $elem.find('a').attr('href')
      const retailer = $elem.find('.store-name').text()

      if (priceText && url) {
        const match = priceText.match(/[\d,]+\.?\d*/)
        if (match) {
          const price = parseFloat(match[0].replace(/,/g, ''))
          results.push({
            retailer: retailer || 'DealNews',
            price,
            url: url.startsWith('http') ? url : `https://www.dealnews.com${url}`,
          })
        }
      }
    })

    return results

  } catch (error) {
    console.error('Error searching DealNews:', error)
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

// Search specific retailers directly
export async function searchSpecificRetailers(productName: string): Promise<AlternativeVendor[]> {
  const results: AlternativeVendor[] = []
  const searchQuery = cleanProductName(productName)

  const retailers = [
    { name: 'Best Buy', searchUrl: `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(searchQuery)}` },
    { name: 'Newegg', searchUrl: `https://www.newegg.com/p/pl?d=${encodeURIComponent(searchQuery)}` },
    { name: 'B&H Photo', searchUrl: `https://www.bhphotovideo.com/c/search?q=${encodeURIComponent(searchQuery)}` },
  ]

  for (const retailer of retailers) {
    try {
      const response = await axios.get(retailer.searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 10000,
      })

      // This is a simplified version - you'd need specific parsers for each retailer
      // For now, we'll rely on Google Shopping for most results

    } catch (error) {
      console.error(`Error searching ${retailer.name}:`, error)
    }
  }

  return results
}
