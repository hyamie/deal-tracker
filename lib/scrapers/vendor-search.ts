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
    const currentHostname = new URL(currentUrl).hostname

    // Search all sources in parallel for better performance
    const [
      googleResults,
      slickdealsResults,
      dealnewsResults,
      camelResults,
      priceGrabberResults,
      brickseekResults,
      pcPartPickerResults,
      techBargainsResults,
      walmartResults,
      targetResults,
      ebayResults,
    ] = await Promise.allSettled([
      searchGoogleShopping(searchQuery, currentUrl),
      searchSlickdeals(searchQuery),
      searchDealNews(searchQuery),
      searchCamelCamelCamel(searchQuery, currentHostname),
      searchPriceGrabber(searchQuery),
      searchBrickSeek(searchQuery),
      searchPCPartPicker(searchQuery),
      searchTechBargains(searchQuery),
      searchWalmart(searchQuery),
      searchTarget(searchQuery),
      searchEbay(searchQuery),
    ])

    // Collect all successful results
    if (googleResults.status === 'fulfilled') alternatives.push(...googleResults.value)
    if (slickdealsResults.status === 'fulfilled') alternatives.push(...slickdealsResults.value)
    if (dealnewsResults.status === 'fulfilled') alternatives.push(...dealnewsResults.value)
    if (camelResults.status === 'fulfilled') alternatives.push(...camelResults.value)
    if (priceGrabberResults.status === 'fulfilled') alternatives.push(...priceGrabberResults.value)
    if (brickseekResults.status === 'fulfilled') alternatives.push(...brickseekResults.value)
    if (pcPartPickerResults.status === 'fulfilled') alternatives.push(...pcPartPickerResults.value)
    if (techBargainsResults.status === 'fulfilled') alternatives.push(...techBargainsResults.value)
    if (walmartResults.status === 'fulfilled') alternatives.push(...walmartResults.value)
    if (targetResults.status === 'fulfilled') alternatives.push(...targetResults.value)
    if (ebayResults.status === 'fulfilled') alternatives.push(...ebayResults.value)

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

// Helper function to use ScraperAPI if available
function getScraperUrl(url: string): string {
  const scraperApiKey = process.env.SCRAPER_API_KEY
  if (scraperApiKey) {
    return `https://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}&render=true`
  }
  return url
}

async function searchGoogleShopping(query: string, excludeUrl: string): Promise<AlternativeVendor[]> {
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop`
    const response = await axios.get(getScraperUrl(searchUrl), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 30000,
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
    const response = await axios.get(getScraperUrl(searchUrl), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 30000,
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
    const response = await axios.get(getScraperUrl(searchUrl), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 30000,
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

// CamelCamelCamel - Amazon price tracking
async function searchCamelCamelCamel(query: string, currentHostname: string): Promise<AlternativeVendor[]> {
  // Only search if current product is from Amazon
  if (!currentHostname.includes('amazon.com')) return []

  try {
    // CamelCamelCamel doesn't have a direct search API, but we can scrape their search results
    const searchUrl = `https://camelcamelcamel.com/search?sq=${encodeURIComponent(query)}`
    const response = await axios.get(getScraperUrl(searchUrl), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 30000,
    })

    const $ = cheerio.load(response.data)
    const results: AlternativeVendor[] = []

    $('.product').slice(0, 3).each((_, element) => {
      const $elem = $(element)
      const priceText = $elem.find('.price').text()
      const url = $elem.find('a').attr('href')

      if (priceText && url) {
        const match = priceText.match(/[\d,]+\.?\d*/)
        if (match) {
          const price = parseFloat(match[0].replace(/,/g, ''))
          results.push({
            retailer: 'Amazon (CCC)',
            price,
            url: url.startsWith('http') ? url : `https://camelcamelcamel.com${url}`,
          })
        }
      }
    })

    return results
  } catch (error) {
    console.error('Error searching CamelCamelCamel:', error)
    return []
  }
}

// PriceGrabber - Multi-retailer price comparison
async function searchPriceGrabber(query: string): Promise<AlternativeVendor[]> {
  try {
    const searchUrl = `https://www.pricegrabber.com/search.php?form_keyword=${encodeURIComponent(query)}`
    const response = await axios.get(getScraperUrl(searchUrl), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 30000,
    })

    const $ = cheerio.load(response.data)
    const results: AlternativeVendor[] = []

    $('.product_listing_box').slice(0, 5).each((_, element) => {
      const $elem = $(element)
      const priceText = $elem.find('.product_listing_price').text()
      const url = $elem.find('.product_listing_name a').attr('href')
      const retailer = $elem.find('.merchant_name').text()

      if (priceText && url) {
        const match = priceText.match(/[\d,]+\.?\d*/)
        if (match) {
          const price = parseFloat(match[0].replace(/,/g, ''))
          results.push({
            retailer: retailer || 'PriceGrabber',
            price,
            url: url.startsWith('http') ? url : `https://www.pricegrabber.com${url}`,
          })
        }
      }
    })

    return results
  } catch (error) {
    console.error('Error searching PriceGrabber:', error)
    return []
  }
}

// BrickSeek - Walmart/Target inventory and pricing
async function searchBrickSeek(query: string): Promise<AlternativeVendor[]> {
  try {
    const searchUrl = `https://brickseek.com/walmart-inventory-checker?sku=${encodeURIComponent(query)}`
    const response = await axios.get(getScraperUrl(searchUrl), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 30000,
    })

    const $ = cheerio.load(response.data)
    const results: AlternativeVendor[] = []

    $('.item-price').each((_, element) => {
      const priceText = $(element).text()
      const match = priceText.match(/[\d,]+\.?\d*/)
      if (match) {
        const price = parseFloat(match[0].replace(/,/g, ''))
        results.push({
          retailer: 'Walmart (BrickSeek)',
          price,
          url: searchUrl,
        })
      }
    })

    return results.slice(0, 3)
  } catch (error) {
    console.error('Error searching BrickSeek:', error)
    return []
  }
}

// PCPartPicker - Computer hardware deals
async function searchPCPartPicker(query: string): Promise<AlternativeVendor[]> {
  try {
    const searchUrl = `https://pcpartpicker.com/search/?q=${encodeURIComponent(query)}`
    const response = await axios.get(getScraperUrl(searchUrl), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 30000,
    })

    const $ = cheerio.load(response.data)
    const results: AlternativeVendor[] = []

    $('.search_results tr').slice(1, 6).each((_, element) => {
      const $elem = $(element)
      const priceText = $elem.find('.td__price').text()
      const url = $elem.find('.td__name a').attr('href')
      const retailer = $elem.find('.td__retailer a').text()

      if (priceText && url) {
        const match = priceText.match(/[\d,]+\.?\d*/)
        if (match) {
          const price = parseFloat(match[0].replace(/,/g, ''))
          results.push({
            retailer: retailer || 'PCPartPicker',
            price,
            url: url.startsWith('http') ? url : `https://pcpartpicker.com${url}`,
          })
        }
      }
    })

    return results
  } catch (error) {
    console.error('Error searching PCPartPicker:', error)
    return []
  }
}

// TechBargains - Electronics deals aggregator
async function searchTechBargains(query: string): Promise<AlternativeVendor[]> {
  try {
    const searchUrl = `https://www.techbargains.com/deals/search?search=${encodeURIComponent(query)}`
    const response = await axios.get(getScraperUrl(searchUrl), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 30000,
    })

    const $ = cheerio.load(response.data)
    const results: AlternativeVendor[] = []

    $('.deal-box').slice(0, 5).each((_, element) => {
      const $elem = $(element)
      const priceText = $elem.find('.deal-price').text()
      const url = $elem.find('.deal-title a').attr('href')
      const retailer = $elem.find('.deal-store').text()

      if (priceText && url) {
        const match = priceText.match(/[\d,]+\.?\d*/)
        if (match) {
          const price = parseFloat(match[0].replace(/,/g, ''))
          results.push({
            retailer: retailer || 'TechBargains',
            price,
            url: url.startsWith('http') ? url : `https://www.techbargains.com${url}`,
          })
        }
      }
    })

    return results
  } catch (error) {
    console.error('Error searching TechBargains:', error)
    return []
  }
}

// Walmart direct search
async function searchWalmart(query: string): Promise<AlternativeVendor[]> {
  try {
    const searchUrl = `https://www.walmart.com/search?q=${encodeURIComponent(query)}`
    const response = await axios.get(getScraperUrl(searchUrl), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 30000,
    })

    const $ = cheerio.load(response.data)
    const results: AlternativeVendor[] = []

    // Walmart uses dynamic rendering, so we'll try to extract from JSON-LD
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const data = JSON.parse($(element).html() || '{}')
        if (data['@type'] === 'Product' && data.offers) {
          const price = parseFloat(data.offers.price)
          const url = data.offers.url || searchUrl

          if (!isNaN(price)) {
            results.push({
              retailer: 'Walmart',
              price,
              url,
            })
          }
        }
      } catch (e) {
        // Skip invalid JSON
      }
    })

    return results.slice(0, 3)
  } catch (error) {
    console.error('Error searching Walmart:', error)
    return []
  }
}

// Target direct search
async function searchTarget(query: string): Promise<AlternativeVendor[]> {
  try {
    const searchUrl = `https://www.target.com/s?searchTerm=${encodeURIComponent(query)}`
    const response = await axios.get(getScraperUrl(searchUrl), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 30000,
    })

    const $ = cheerio.load(response.data)
    const results: AlternativeVendor[] = []

    // Target also uses dynamic rendering, try JSON-LD extraction
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const data = JSON.parse($(element).html() || '{}')
        if (data['@type'] === 'Product' && data.offers) {
          const price = parseFloat(data.offers.price)
          const url = data.offers.url || searchUrl

          if (!isNaN(price)) {
            results.push({
              retailer: 'Target',
              price,
              url,
            })
          }
        }
      } catch (e) {
        // Skip invalid JSON
      }
    })

    return results.slice(0, 3)
  } catch (error) {
    console.error('Error searching Target:', error)
    return []
  }
}

// eBay search
async function searchEbay(query: string): Promise<AlternativeVendor[]> {
  try {
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sop=15` // Sort by price + shipping: lowest first
    const response = await axios.get(getScraperUrl(searchUrl), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 30000,
    })

    const $ = cheerio.load(response.data)
    const results: AlternativeVendor[] = []

    $('.s-item').slice(0, 5).each((_, element) => {
      const $elem = $(element)
      const priceText = $elem.find('.s-item__price').first().text()
      const url = $elem.find('.s-item__link').attr('href')

      if (priceText && url) {
        const match = priceText.match(/[\d,]+\.?\d*/)
        if (match) {
          const price = parseFloat(match[0].replace(/,/g, ''))
          results.push({
            retailer: 'eBay',
            price,
            url,
          })
        }
      }
    })

    return results
  } catch (error) {
    console.error('Error searching eBay:', error)
    return []
  }
}
