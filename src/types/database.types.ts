export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          icon: string | null;
          id: string;
          name_ar: string;
          name_en: string;
          parent_id: string | null;
          slug: string;
        };
        Insert: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name_ar: string;
          name_en: string;
          parent_id?: string | null;
          slug: string;
        };
        Update: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name_ar?: string;
          name_en?: string;
          parent_id?: string | null;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price_dzd: number;
          variant: Json;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity?: number;
          unit_price_dzd: number;
          variant?: Json;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price_dzd?: number;
          variant?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          address: string;
          admin_note: string | null;
          chargily_ref: string | null;
          commune: string;
          created_at: string;
          full_name: string;
          id: string;
          payment_method: string | null;
          phone: string;
          shipping_fee: number | null;
          shipping_method: string | null;
          status: Database["public"]["Enums"]["order_status"];
          terms_accepted: boolean;
          total_dzd: number;
          tracking_number: string | null;
          user_id: string;
          wilaya: string;
          yalidine_desk: string | null;
          zip_code: string;
        };
        Insert: {
          address: string;
          admin_note?: string | null;
          chargily_ref?: string | null;
          commune: string;
          created_at?: string;
          full_name: string;
          id?: string;
          payment_method?: string | null;
          phone: string;
          shipping_fee?: number | null;
          shipping_method?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          terms_accepted?: boolean;
          total_dzd: number;
          tracking_number?: string | null;
          user_id: string;
          wilaya: string;
          yalidine_desk?: string | null;
          zip_code: string;
        };
        Update: {
          address?: string;
          admin_note?: string | null;
          chargily_ref?: string | null;
          commune?: string;
          created_at?: string;
          full_name?: string;
          id?: string;
          payment_method?: string | null;
          phone?: string;
          shipping_fee?: number | null;
          shipping_method?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          terms_accepted?: boolean;
          total_dzd?: number;
          tracking_number?: string | null;
          user_id?: string;
          wilaya?: string;
          yalidine_desk?: string | null;
          zip_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          auto_hidden: boolean;
          avg_rating: number;
          category_id: string;
          created_at: string;
          description_ar: string | null;
          description_en: string | null;
          id: string;
          images: Json;
          is_published: boolean;
          last_known_available: boolean;
          name_ar: string;
          name_en: string;
          price_dzd: number | null;
          price_usd: number;
          stock_quantity: number | null;
          variants: Json;
        };
        Insert: {
          auto_hidden?: boolean;
          avg_rating?: number;
          category_id: string;
          created_at?: string;
          description_ar?: string | null;
          description_en?: string | null;
          id?: string;
          images?: Json;
          is_published?: boolean;
          last_known_available?: boolean;
          name_ar: string;
          name_en: string;
          price_dzd?: number | null;
          price_usd: number;
          stock_quantity?: number | null;
          variants?: Json;
        };
        Update: {
          auto_hidden?: boolean;
          avg_rating?: number;
          category_id?: string;
          created_at?: string;
          description_ar?: string | null;
          description_en?: string | null;
          id?: string;
          images?: Json;
          is_published?: boolean;
          last_known_available?: boolean;
          name_ar?: string;
          name_en?: string;
          price_dzd?: number | null;
          price_usd?: number;
          stock_quantity?: number | null;
          variants?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          images: Json | null;
          order_id: string | null;
          product_id: string;
          rating: number;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          images?: Json | null;
          order_id?: string | null;
          product_id: string;
          rating: number;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          images?: Json | null;
          order_id?: string | null;
          product_id?: string;
          rating?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          commission_rate: number;
          id: number;
          inventory_mode: string | null;
          payment_methods: Json | null;
          profit_per_usd: number | null;
          shipping_cost_dzd: number | null;
          site_active: boolean;
          updated_at: string;
          usd_to_dzd_rate: number;
        };
        Insert: {
          commission_rate?: number;
          id?: number;
          inventory_mode?: string | null;
          payment_methods?: Json | null;
          profit_per_usd?: number | null;
          shipping_cost_dzd?: number | null;
          site_active?: boolean;
          updated_at?: string;
          usd_to_dzd_rate?: number;
        };
        Update: {
          commission_rate?: number;
          id?: number;
          inventory_mode?: string | null;
          payment_methods?: Json | null;
          profit_per_usd?: number | null;
          shipping_cost_dzd?: number | null;
          site_active?: boolean;
          updated_at?: string;
          usd_to_dzd_rate?: number;
        };
        Relationships: [];
      };
      shipping_fees: {
        Row: {
          created_at: string | null;
          desk_fee: number;
          home_fee: number;
          id: number;
          is_active: boolean | null;
          wilaya_code: number;
          wilaya_name: string;
        };
        Insert: {
          created_at?: string | null;
          desk_fee?: number;
          home_fee?: number;
          id?: number;
          is_active?: boolean | null;
          wilaya_code: number;
          wilaya_name: string;
        };
        Update: {
          created_at?: string | null;
          desk_fee?: number;
          home_fee?: number;
          id?: number;
          is_active?: boolean | null;
          wilaya_code?: number;
          wilaya_name?: string;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          order_id: string | null;
          reply: string | null;
          status: Database["public"]["Enums"]["ticket_status"];
          subject: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          order_id?: string | null;
          reply?: string | null;
          status?: Database["public"]["Enums"]["ticket_status"];
          subject: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          order_id?: string | null;
          reply?: string | null;
          status?: Database["public"]["Enums"]["ticket_status"];
          subject?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "support_tickets_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          is_active: boolean;
          phone: string;
          role: Database["public"]["Enums"]["user_role"];
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          is_active?: boolean;
          phone: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          phone?: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      alert_action: "auto_hidden" | "kept_visible";
      alert_status: "pending" | "updated" | "dismissed";
      availability_reason: "not_found" | "seller_closed" | "out_of_stock";
      order_status:
        | "pending"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "not_received"
        | "cancelled";
      price_source: "manual" | "auto";
      ticket_status: "open" | "closed";
      user_role: "customer" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
