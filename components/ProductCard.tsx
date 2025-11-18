'use client'

import { useState } from 'react'
import { Database } from '@/lib/database.types'

type Product = Database['public']['Tables']['products']['Row']

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

  const handleSaveTarget = () => {
    const price = targetPrice ? parseFloat(targetPrice) : null
    onUpdate(product.id, { target_price: price })
    setIsEditing(false)
  }

  const handleCheck = async () => {
    setIsChecking(true)
    await onCheck(product.id)
    setIsChecking(false)
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
          <h3 className="font-bold text-lg mb-1">{product.name}</h3>
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
        </div>
      </div>
    </div>
  )
}
