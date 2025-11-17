'use client'

import { useState } from 'react'

interface AddProductFormProps {
  onAdd: (name: string, url: string, targetPrice: number | null) => Promise<void>
}

export default function AddProductForm({ onAdd }: AddProductFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const price = targetPrice ? parseFloat(targetPrice) : null
      await onAdd(name, url, price)

      // Reset form
      setName('')
      setUrl('')
      setTargetPrice('')
      setIsOpen(false)
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Failed to add product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-lg font-semibold"
      >
        ➕ Add New Product
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-200">
      <h2 className="text-2xl font-bold mb-4 text-purple-800">Add New Product</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., NVIDIA RTX 4090"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product URL *
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="https://www.amazon.com/..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Supports: Amazon, Best Buy, Newegg, B&H Photo, Microcenter
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Price (Optional)
          </label>
          <input
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            step="0.01"
            min="0"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500 mt-1">
            You'll get an email alert when the price drops to or below this amount
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-semibold"
          >
            {isSubmitting ? 'Adding...' : '✅ Add Product'}
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>

      {isSubmitting && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            📊 Fetching current price and searching for alternative deals...
          </p>
        </div>
      )}
    </div>
  )
}
