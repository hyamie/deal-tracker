import axios from 'axios'
import * as cheerio from 'cheerio'

export interface PriceData {
  price: number | null
  inStock: boolean
  imageUrl?: string
  title?: string
}

export async function scrapePrice(url: string): Promise<PriceData> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000,
    })

    const $ = cheerio.load(response.data)
    const hostname = new URL(url).hostname.toLowerCase()

    // Amazon
    if (hostname.includes('amazon.com')) {
      return scrapeAmazon($)
    }

    // Best Buy
    if (hostname.includes('bestbuy.com')) {
      return scrapeBestBuy($)
    }

    // Newegg
    if (hostname.includes('newegg.com')) {
      return scrapeNewegg($)
    }

    // B&H Photo
    if (hostname.includes('bhphotovideo.com')) {
      return scrapeBH($)
    }

    // Microcenter
    if (hostname.includes('microcenter.com')) {
      return scrapeMicrocenter($)
    }

    // Generic fallback
    return scrapeGeneric($)

  } catch (error) {
    console.error('Error scraping price:', error)
    return { price: null, inStock: false }
  }
}

function scrapeAmazon($: cheerio.CheerioAPI): PriceData {
  let price: number | null = null

  // Try multiple price selectors
  const priceSelectors = [
    '.a-price .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '.a-price-whole',
    'span.a-color-price'
  ]

  for (const selector of priceSelectors) {
    const priceText = $(selector).first().text().trim()
    if (priceText) {
      const match = priceText.match(/[\d,]+\.?\d*/)?.[0]
      if (match) {
        price = parseFloat(match.replace(/,/g, ''))
        break
      }
    }
  }

  const title = $('#productTitle').text().trim()
  const imageUrl = $('#landingImage').attr('src') || $('.a-dynamic-image').first().attr('src')
  const inStock = !$('#availability .a-color-state').text().includes('unavailable') &&
                  !$('#availability .a-color-price').text().includes('unavailable')

  return { price, inStock, imageUrl, title }
}

function scrapeBestBuy($: cheerio.CheerioAPI): PriceData {
  let price: number | null = null

  const priceText = $('.priceView-customer-price span[aria-hidden="true"]').first().text().trim()
  if (priceText) {
    const match = priceText.match(/[\d,]+\.?\d*/)
    if (match) {
      price = parseFloat(match[0].replace(/,/g, ''))
    }
  }

  const title = $('.sku-title h1').text().trim()
  const imageUrl = $('.primary-image').attr('src')
  const inStock = !$('.fulfillment-add-to-cart-button').hasClass('btn-disabled')

  return { price, inStock, imageUrl, title }
}

function scrapeNewegg($: cheerio.CheerioAPI): PriceData {
  let price: number | null = null

  const priceText = $('.price-current strong').text().trim() + $('.price-current sup').text().trim()
  if (priceText) {
    const match = priceText.match(/[\d,]+\.?\d*/)
    if (match) {
      price = parseFloat(match[0].replace(/,/g, ''))
    }
  }

  const title = $('.product-title').text().trim()
  const imageUrl = $('.product-view-img-original').attr('src')
  const inStock = !$('.product-inventory strong').text().includes('OUT OF STOCK')

  return { price, inStock, imageUrl, title }
}

function scrapeBH($: cheerio.CheerioAPI): PriceData {
  let price: number | null = null

  const priceText = $('[data-selenium="pricingPrice"]').text().trim()
  if (priceText) {
    const match = priceText.match(/[\d,]+\.?\d*/)
    if (match) {
      price = parseFloat(match[0].replace(/,/g, ''))
    }
  }

  const title = $('[data-selenium="productTitle"]').text().trim()
  const imageUrl = $('.mainImage img').attr('src')
  const inStock = $('[data-selenium="stockStatus"]').text().includes('In Stock')

  return { price, inStock, imageUrl, title }
}

function scrapeMicrocenter($: cheerio.CheerioAPI): PriceData {
  let price: number | null = null

  const priceText = $('#pricing').text().trim()
  if (priceText) {
    const match = priceText.match(/[\d,]+\.?\d*/)
    if (match) {
      price = parseFloat(match[0].replace(/,/g, ''))
    }
  }

  const title = $('h1[itemprop="name"]').text().trim()
  const imageUrl = $('.product-image-gallery img').first().attr('src')
  const inStock = $('.inventory').text().includes('In Stock')

  return { price, inStock, imageUrl, title }
}

function scrapeGeneric($: cheerio.CheerioAPI): PriceData {
  let price: number | null = null

  // Try common price patterns
  const pricePatterns = [
    '[itemprop="price"]',
    '.price',
    '[class*="price"]',
    '[id*="price"]',
    'meta[property="og:price:amount"]',
  ]

  for (const pattern of pricePatterns) {
    const element = $(pattern).first()
    const priceText = element.attr('content') || element.text()
    if (priceText) {
      const match = priceText.match(/[\d,]+\.?\d*/)
      if (match) {
        price = parseFloat(match[0].replace(/,/g, ''))
        break
      }
    }
  }

  const title = $('h1').first().text().trim() || $('meta[property="og:title"]').attr('content') || ''
  const imageUrl = $('meta[property="og:image"]').attr('content')

  return { price, inStock: true, imageUrl, title }
}

export function getRetailerName(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase()

  if (hostname.includes('amazon.com')) return 'Amazon'
  if (hostname.includes('bestbuy.com')) return 'Best Buy'
  if (hostname.includes('newegg.com')) return 'Newegg'
  if (hostname.includes('bhphotovideo.com')) return 'B&H Photo'
  if (hostname.includes('microcenter.com')) return 'Microcenter'

  return hostname.replace('www.', '').split('.')[0]
}
