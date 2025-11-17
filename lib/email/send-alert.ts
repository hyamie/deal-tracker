import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface PriceAlert {
  productName: string
  productUrl: string
  oldPrice: number | null
  newPrice: number
  targetPrice: number | null
  imageUrl?: string
  alternatives?: Array<{
    retailer: string
    price: number
    url: string
  }>
}

export async function sendPriceDropAlert(alert: PriceAlert, toEmail: string): Promise<void> {
  const priceDrop = alert.oldPrice ? alert.oldPrice - alert.newPrice : 0
  const percentageDrop = alert.oldPrice ? ((priceDrop / alert.oldPrice) * 100).toFixed(0) : 0

  const subject = alert.targetPrice && alert.newPrice <= alert.targetPrice
    ? `🎯 Target Price Reached: ${alert.productName}`
    : `💰 Price Drop Alert: ${alert.productName}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .product-image { width: 100%; max-width: 300px; height: auto; margin: 20px auto; display: block; border-radius: 8px; }
    .price-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .price { font-size: 32px; font-weight: bold; color: #10b981; }
    .old-price { text-decoration: line-through; color: #6b7280; font-size: 18px; }
    .savings { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; }
    .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
    .alternatives { margin-top: 30px; }
    .alt-item { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #667eea; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Price Drop Alert!</h1>
    </div>
    <div class="content">
      <h2>${alert.productName}</h2>

      ${alert.imageUrl ? `<img src="${alert.imageUrl}" alt="${alert.productName}" class="product-image" />` : ''}

      <div class="price-box">
        ${alert.oldPrice ? `<div class="old-price">Was: $${alert.oldPrice.toFixed(2)}</div>` : ''}
        <div class="price">$${alert.newPrice.toFixed(2)}</div>
        ${priceDrop > 0 ? `
          <div class="savings">
            Save $${priceDrop.toFixed(2)} (${percentageDrop}% off)
          </div>
        ` : ''}
        ${alert.targetPrice && alert.newPrice <= alert.targetPrice ? `
          <p style="color: #10b981; font-weight: bold; margin-top: 15px;">
            ✅ Target price of $${alert.targetPrice.toFixed(2)} reached!
          </p>
        ` : ''}
      </div>

      <a href="${alert.productUrl}" class="button">View Deal →</a>

      ${alert.alternatives && alert.alternatives.length > 0 ? `
        <div class="alternatives">
          <h3>Alternative Deals Found:</h3>
          ${alert.alternatives.map(alt => `
            <div class="alt-item">
              <strong>${alt.retailer}</strong><br/>
              <span style="font-size: 24px; color: #667eea; font-weight: bold;">$${alt.price.toFixed(2)}</span><br/>
              <a href="${alt.url}" style="color: #667eea;">View at ${alt.retailer} →</a>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>You're receiving this because you're tracking this product in your Deal Tracker.</p>
      <p style="font-size: 12px; color: #9ca3af;">Deal Tracker - Never miss a deal again!</p>
    </div>
  </div>
</body>
</html>
  `

  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'deals@dealtracker.com',
      to: toEmail,
      subject,
      html,
    })
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

export async function sendDailySummary(
  products: Array<{
    name: string
    url: string
    currentPrice: number | null
    targetPrice: number | null
    imageUrl?: string
  }>,
  toEmail: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .product-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .product-name { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
    .price { color: #667eea; font-size: 24px; font-weight: bold; }
    .target { color: #6b7280; font-size: 14px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Daily Price Summary</h1>
    </div>
    <div class="content">
      <p>Here's your daily update on tracked products:</p>
      ${products.map(product => `
        <div class="product-card">
          <div class="product-name">${product.name}</div>
          <div class="price">
            ${product.currentPrice ? `$${product.currentPrice.toFixed(2)}` : 'Price unavailable'}
          </div>
          ${product.targetPrice ? `
            <div class="target">Target: $${product.targetPrice.toFixed(2)}</div>
          ` : ''}
          <a href="${product.url}" style="color: #667eea; text-decoration: none;">View Product →</a>
        </div>
      `).join('')}
    </div>
    <div class="footer">
      <p>Deal Tracker - Your personal price monitor</p>
    </div>
  </div>
</body>
</html>
  `

  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'deals@dealtracker.com',
      to: toEmail,
      subject: '📊 Your Daily Deal Tracker Summary',
      html,
    })
  } catch (error) {
    console.error('Error sending daily summary:', error)
    throw error
  }
}
