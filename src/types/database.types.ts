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
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: 'customer' | 'admin'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'admin'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'admin'
          is_active?: boolean
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: number
          usd_to_dzd_rate: number
          commission_rate: number
          site_active: boolean
          price_alert_threshold: number
          monitor_enabled: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          usd_to_dzd_rate?: number
          commission_rate?: number
          site_active?: boolean
          price_alert_threshold?: number
          monitor_enabled?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          usd_to_dzd_rate?: number
          commission_rate?: number
          site_active?: boolean
          price_alert_threshold?: number
          monitor_enabled?: boolean
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name_ar: string
          name_en: string
          slug: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name_ar: string
          name_en: string
          slug: string
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
          parent_id?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name_ar: string
          name_en: string
          description_ar: string | null
          description_en: string | null
          price_usd: number
          aliexpress_url: string | null
          category_id: string | null
          images: string[]
          variants: Json[]
          product_badge: 'brand' | 'choice' | null
          avg_rating: number
          is_published: boolean
          last_known_available: boolean
          auto_hidden: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name_ar: string
          name_en: string
          description_ar?: string | null
          description_en?: string | null
          price_usd: number
          aliexpress_url?: string | null
          category_id?: string | null
          images?: string[]
          variants?: Json[]
          product_badge?: 'brand' | 'choice' | null
          avg_rating?: number
          is_published?: boolean
          last_known_available?: boolean
          auto_hidden?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name_ar?: string
          name_en?: string
          description_ar?: string | null
          description_en?: string | null
          price_usd?: number
          aliexpress_url?: string | null
          category_id?: string | null
          images?: string[]
          variants?: Json[]
          product_badge?: 'brand' | 'choice' | null
          avg_rating?: number
          is_published?: boolean
          last_known_available?: boolean
          auto_hidden?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'rejected'
          total_dzd: number
          full_name: string
          address: string
          wilaya: string
          commune: string
          zip_code: string
          phone: string
          tracking_number: string | null
          chargily_ref: string | null
          terms_accepted: boolean
          admin_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'rejected'
          total_dzd: number
          full_name: string
          address: string
          wilaya: string
          commune: string
          zip_code: string
          phone: string
          tracking_number?: string | null
          chargily_ref?: string | null
          terms_accepted?: boolean
          admin_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'rejected'
          total_dzd?: number
          full_name?: string
          address?: string
          wilaya?: string
          commune?: string
          zip_code?: string
          phone?: string
          tracking_number?: string | null
          chargily_ref?: string | null
          terms_accepted?: boolean
          admin_note?: string | null
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price_dzd: number
          variant: Json
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          unit_price_dzd: number
          variant?: Json
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price_dzd?: number
          variant?: Json
        }
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          order_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          order_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          order_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string
          order_id: string | null
          subject: string
          message: string
          status: 'open' | 'closed'
          reply: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id?: string | null
          subject: string
          message: string
          status?: 'open' | 'closed'
          reply?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_id?: string | null
          subject?: string
          message?: string
          status?: 'open' | 'closed'
          reply?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
