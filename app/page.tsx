'use client'

import { useEffect, useState } from 'react'
import ProductCard from '@/components/ProductCard'
import AddProductForm from '@/components/AddProductForm'
import { Database } from '@/lib/database.types'

type Product = Database['public']['Tables']['products']['Row']

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingAll, setIsCheckingAll] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: {
          'x-user-email': process.env.NEXT_PUBLIC_USER_EMAIL || '',
        },
      })
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduct = async (name: string, url: string, targetPrice: number | null) => {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': process.env.NEXT_PUBLIC_USER_EMAIL || '',
      },
      body: JSON.stringify({ name, url, targetPrice }),
    })

    if (!response.ok) {
      throw new Error('Failed to add product')
    }

    await fetchProducts()
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    await fetch(`/api/products?id=${id}`, {
      method: 'DELETE',
    })

    setProducts(products.filter(p => p.id !== id))
  }

  const handleCheckProduct = async (id: string) => {
    try {
      const response = await fetch('/api/check-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': process.env.NEXT_PUBLIC_USER_EMAIL || '',
        },
        body: JSON.stringify({ productId: id }),
      })

      const data = await response.json()

      setProducts(products.map(p =>
        p.id === id ? data.product : p
      ))

      if (data.alternatives && data.alternatives.length > 0) {
        const bestAlt = data.alternatives[0]
        if (bestAlt.price < (data.product.current_price || Infinity)) {
          alert(`Found better price at ${bestAlt.retailer}: $${bestAlt.price.toFixed(2)}`)
        }
      }

      if (data.targetReached) {
        alert('Target price reached! Check your email for details.')
      }
    } catch (error) {
      console.error('Error checking price:', error)
      alert('Failed to check price. Please try again.')
    }
  }

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      setProducts(products.map(p =>
        p.id === id ? data.product : p
      ))
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  const handleCheckAll = async () => {
    setIsCheckingAll(true)

    try {
      const response = await fetch('/api/check-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': process.env.NEXT_PUBLIC_USER_EMAIL || '',
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()

      await fetchProducts()

      const targetReachedCount = data.results.filter((r: any) => r.targetReached).length
      if (targetReachedCount > 0) {
        alert(`${targetReachedCount} product(s) reached target price! Check your email.`)
      } else {
        alert('All products checked!')
      }
    } catch (error) {
      console.error('Error checking all prices:', error)
      alert('Failed to check prices. Please try again.')
    } finally {
      setIsCheckingAll(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl text-purple-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Deal Tracker
          </h1>
          <p className="text-gray-600 text-lg">
            Never miss a deal - Track prices, get alerts, find better deals
          </p>
        </div>

        <div className="flex gap-4 mb-8 justify-center flex-wrap">
          <AddProductForm onAdd={handleAddProduct} />

          {products.length > 0 && (
            <button
              onClick={handleCheckAll}
              disabled={isCheckingAll}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-lg font-semibold disabled:opacity-50"
            >
              {isCheckingAll ? 'Checking...' : 'Check All Prices'}
            </button>
          )}
        </div>

        {products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">{products.length}</div>
              <div className="text-gray-600">Total Products</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-green-600">
                {products.filter(p => p.target_price && p.current_price && p.current_price <= p.target_price).length}
              </div>
              <div className="text-gray-600">Target Reached</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">
                ${products.reduce((sum, p) => sum + (p.current_price || 0), 0).toFixed(2)}
              </div>
              <div className="text-gray-600">Total Value</div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">Shopping Cart</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">No products yet</h2>
              <p className="text-gray-500">
                Add your first product to start tracking deals!
              </p>
            </div>
          ) : (
            products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onDelete={handleDeleteProduct}
                onCheck={handleCheckProduct}
                onUpdate={handleUpdateProduct}
              />
            ))
          )}
        </div>

        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>Tip: Set target prices to get email alerts when deals go live!</p>
          <p className="mt-2">Automatic price checks run daily at 9 AM</p>
        </div>
      </div>
    </div>
  )
}
