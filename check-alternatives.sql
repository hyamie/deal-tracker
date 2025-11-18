-- Check if there are any alternative deals in the database
SELECT 
  ad.id,
  ad.product_id,
  p.name as product_name,
  ad.retailer,
  ad.price,
  ad.url,
  ad.created_at
FROM alternative_deals ad
JOIN products p ON ad.product_id = p.id
ORDER BY ad.created_at DESC
LIMIT 20;
