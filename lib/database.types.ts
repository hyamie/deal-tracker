export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          url: string
          current_price: number | null
          target_price: number | null
          image_url: string | null
          category: string | null
          retailer: string | null
          last_checked: string | null
          in_stock: boolean
          user_email: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          url: string
          current_price?: number | null
          target_price?: number | null
          image_url?: string | null
          category?: string | null
          retailer?: string | null
          last_checked?: string | null
          in_stock?: boolean
          user_email: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          url?: string
          current_price?: number | null
          target_price?: number | null
          image_url?: string | null
          category?: string | null
          retailer?: string | null
          last_checked?: string | null
          in_stock?: boolean
          user_email?: string
        }
      }
      price_history: {
        Row: {
          id: string
          product_id: string
          price: number
          checked_at: string
          url: string
        }
        Insert: {
          id?: string
          product_id: string
          price: number
          checked_at?: string
          url: string
        }
        Update: {
          id?: string
          product_id?: string
          price?: number
          checked_at?: string
          url?: string
        }
      }
      alternative_deals: {
        Row: {
          id: string
          product_id: string
          retailer: string
          price: number
          url: string
          found_at: string
        }
        Insert: {
          id?: string
          product_id: string
          retailer: string
          price: number
          url: string
          found_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          retailer?: string
          price?: number
          url?: string
          found_at?: string
        }
      }
    }
  }
}
