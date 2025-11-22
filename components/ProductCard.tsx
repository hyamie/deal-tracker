'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, AlternativeDeal, PriceHistory } from '@/lib/types'

interface ProductCardProps {
  product: Product
  onDelete: (id: string) => void
  onCheck: (id: string) => void
  onUpdate: (id: string, data: Partial<Product>) => void
}

export default function ProductCard({ product, onDelete, onCheck, onUpdate }: ProductCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [targetPrice, setTargetPrice] = useState(product.target_price?.toString() || '')
  const [isChecking, setIsChecking] = useState(false)
  const [alternatives, setAlternatives] = useState<AlternativeDeal[]>([])
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const handleSaveTarget = () => {
    const price = targetPrice ? parseFloat(targetPrice) : null
    onUpdate(product.id, { target_price: price })
    setIsEditing(false)
  }

  useEffect(() => {
    fetchAlternatives()
    fetchPriceHistory()
  }, [product.id])

  const fetchAlternatives = async () => {
    const { data } = await supabase
      .from('alternative_deals')
      .select('*')
      .eq('product_id', product.id)
      .order('price', { ascending: true })
      .limit(5)

    if (data) {
      setAlternatives(data)
    }
  }

  const fetchPriceHistory = async () => {
    try {
      const response = await fetch(`/api/price-history?productId=${product.id}`)
      const data = await response.json()
      if (data.history) {
        setPriceHistory(data.history)
      }
    } catch (error) {
      console.error('Error fetching price history:', error)
    }
  }

  const handleCheck = async () => {
    setIsChecking(true)
    await onCheck(product.id)
    setIsChecking(false)
    // Refresh alternatives and price history after checking
    await fetchAlternatives()
    await fetchPriceHistory()
  }

  const priceStatus = () => {
    if (!product.current_price || !product.target_price) return 'neutral'
    return product.current_price <= product.target_price ? 'good' : 'waiting'
  }

  const status = priceStatus()

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
      status === 'good' ? 'border-green-500' :
      status === 'waiting' ? 'border-yellow-500' :
      'border-gray-300'
    }`}>
      <div className="flex gap-4">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-24 h-24 object-cover rounded"
          />
        )}

        <div className="flex-1">
          <h3 className="font-bold text-xl mb-1 text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{product.retailer}</p>

          <div className="flex items-center gap-4 mb-3">
            <div>
              <span className="text-sm text-gray-500">Current Price:</span>
              <div className="text-2xl font-bold text-purple-600">
                {product.current_price ? `$${product.current_price.toFixed(2)}` : 'N/A'}
              </div>
            </div>

            <div>
              <span className="text-sm text-gray-500">Target Price:</span>
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="border rounded px-2 py-1 w-24 text-gray-900 bg-white"
                    placeholder="0.00"
                    step="0.01"
                  />
                  <button
                    onClick={handleSaveTarget}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div
                  className="text-xl font-semibold text-gray-700 cursor-pointer hover:text-purple-600"
                  onClick={() => setIsEditing(true)}
                >
                  {product.target_price ? `$${product.target_price.toFixed(2)}` : 'Set target'}
                </div>
              )}
            </div>
          </div>

          {product.last_checked && (
            <p className="text-xs text-gray-500 mb-3">
              Last checked: {new Date(product.last_checked).toLocaleString()}
            </p>
          )}

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleCheck}
              disabled={isChecking}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400 text-sm"
            >
              {isChecking ? 'Checking...' : '🔄 Check Price'}
            </button>

            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
            >
              🔗 View Product
            </a>

            <button
              onClick={() => onDelete(product.id)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
            >
              🗑️ Delete
            </button>
          </div>

          {status === 'good' && (
            <div className="mt-3 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
              ✅ Target price reached!
            </div>
          )}

          {/* Price History Section */}
          {priceHistory.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-2"
              >
                {showHistory ? '▼' : '▶'}
                📊 Price History ({priceHistory.length} checks)
                {priceHistory.length >= 2 && priceHistory[0].price < priceHistory[1].price && (
                  <span className="text-green-600 font-bold">📉 Price dropped!</span>
                )}
                {priceHistory.length >= 2 && priceHistory[0].price > priceHistory[1].price && (
                  <span className="text-red-600 font-bold">📈 Price increased</span>
                )}
              </button>

              {showHistory && (
                <div className="mt-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {priceHistory.map((entry, index) => {
                        const prevPrice = index < priceHistory.length - 1 ? priceHistory[index + 1].price : null
                        const priceDiff = prevPrice ? entry.price - prevPrice : 0
                        const isLowest = entry.price === Math.min(...priceHistory.map(h => h.price))
                        
                        return (
                          <div
                            key={entry.id}
                            className={`flex items-center justify-between p-2 rounded ${
                              isLowest ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-purple-600">
                                  ${entry.price.toFixed(2)}
                                </span>
                                {isLowest && (
                                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded font-bold">
                                    LOWEST
                                  </span>
                                )}
                                {priceDiff !== 0 && (
                                  <span className={`text-xs font-semibold ${
                                    priceDiff < 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {priceDiff < 0 ? '↓' : '↑'} ${Math.abs(priceDiff).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(entry.checked_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Alternative Deals Section */}
          {alternatives.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-2"
              >
                {showAlternatives ? '▼' : '▶'}
                {alternatives.length} Alternative{alternatives.length !== 1 ? 's' : ''} Found
                {alternatives[0].price < (product.current_price || Infinity) && (
                  <span className="text-green-600 font-bold">💰 Better price available!</span>
                )}
              </button>

              {showAlternatives && (
                <div className="mt-3 space-y-2">
                  {alternatives.map((alt, index) => (
                    <div
                      key={alt.id}
                      className={`flex items-center justify-between p-3 rounded border ${
                        alt.price < (product.current_price || Infinity)
                          ? 'bg-green-50 border-green-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {index === 0 && alt.price < (product.current_price || Infinity) && (
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded font-bold">
                              BEST DEAL
                            </span>
                          )}
                          <span className="font-semibold text-gray-900">{alt.retailer}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-bold text-purple-600">
                            ${alt.price.toFixed(2)}
                          </span>
                          {product.current_price && alt.price < product.current_price && (
                            <span className="text-sm text-green-600 font-semibold">
                              Save ${(product.current_price - alt.price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <a
                        href={alt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm font-semibold"
                      >
                        View Deal →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
