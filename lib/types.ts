/**
 * Shared Type Definitions for Deal Tracker
 * Centralized types to avoid duplication and improve type safety
 */

import { Database } from './database.types'

// Database table types
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type PriceHistory = Database['public']['Tables']['price_history']['Row']
export type PriceHistoryInsert = Database['public']['Tables']['price_history']['Insert']

export type AlternativeDeal = Database['public']['Tables']['alternative_deals']['Row']
export type AlternativeDealInsert = Database['public']['Tables']['alternative_deals']['Insert']

// API request/response types
export interface CreateProductRequest {
  name: string
  url: string
  targetPrice?: number
}

export interface PriceData {
  price: number | null
  inStock: boolean
  imageUrl?: string | null
}

export interface AlternativeVendor {
  retailer: string
  price: number
  url: string
}

export interface ProductCheckResult {
  product: Product
  priceChanged?: boolean
  targetReached?: boolean
  alternatives?: AlternativeVendor[]
  error?: string
}

// Error response type
export interface ApiError {
  error: string
  details?: string
}
