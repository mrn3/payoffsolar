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
      customers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          first_name: string
          last_name: string
          email: string
          phone: string
          address: string
          city: string
          state: string
          zip: string
          notes: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name: string
          last_name: string
          email: string
          phone: string
          address: string
          city: string
          state: string
          zip: string
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          address?: string
          city?: string
          state?: string
          zip?: string
          notes?: string | null
          user_id?: string | null
        }
      }
      products: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string
          price: number
          image_url: string | null
          category_id: string | null
          sku: string
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description: string
          price: number
          image_url?: string | null
          category_id?: string | null
          sku: string
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string
          price?: number
          image_url?: string | null
          category_id?: string | null
          sku?: string
          is_active?: boolean
        }
      }
      product_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          slug: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          slug: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          slug?: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      product_tags: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      product_tags_junction: {
        Row: {
          product_id: string
          tag_id: string
        }
        Insert: {
          product_id: string
          tag_id: string
        }
        Update: {
          product_id?: string
          tag_id?: string
        }
      }
      inventory: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          product_id: string
          warehouse_id: string
          quantity: number
          min_quantity: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          product_id: string
          warehouse_id: string
          quantity: number
          min_quantity: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          product_id?: string
          warehouse_id?: string
          quantity?: number
          min_quantity?: number
        }
      }
      warehouses: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          address: string
          city: string
          state: string
          zip: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          address: string
          city: string
          state: string
          zip: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          address?: string
          city?: string
          state?: string
          zip?: string
        }
      }
      orders: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          customer_id: string
          status: string
          total: number
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          customer_id: string
          status: string
          total: number
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          customer_id?: string
          status?: string
          total?: number
          notes?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          order_id: string
          product_id: string
          quantity: number
          price: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
        }
      }
      invoices: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          order_id: string
          status: string
          due_date: string
          amount: number
          paid_amount: number
          payment_method_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          order_id: string
          status: string
          due_date: string
          amount: number
          paid_amount: number
          payment_method_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          order_id?: string
          status?: string
          due_date?: string
          amount?: number
          paid_amount?: number
          payment_method_id?: string | null
        }
      }
      payment_methods: {
        Row: {
          id: string
          name: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_active?: boolean
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          amount: number
          payment_date: string
          payment_method_id: string | null
          transaction_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          amount: number
          payment_date?: string
          payment_method_id?: string | null
          transaction_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          amount?: number
          payment_date?: string
          payment_method_id?: string | null
          transaction_id?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      content: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          slug: string
          content: string
          type_id: string | null
          published: boolean
          author_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          slug: string
          content: string
          type_id?: string | null
          published?: boolean
          author_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          slug?: string
          content?: string
          type_id?: string | null
          published?: boolean
          author_id?: string
        }
      }
      content_types: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      content_categories: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
      }
      content_categories_junction: {
        Row: {
          content_id: string
          category_id: string
        }
        Insert: {
          content_id: string
          category_id: string
        }
        Update: {
          content_id?: string
          category_id?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number | null
          duration: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price?: number | null
          duration?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number | null
          duration?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      service_appointments: {
        Row: {
          id: string
          customer_id: string
          service_id: string
          scheduled_date: string
          scheduled_time: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          service_id: string
          scheduled_date: string
          scheduled_time: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          service_id?: string
          scheduled_date?: string
          scheduled_time?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      staff_assignments: {
        Row: {
          id: string
          appointment_id: string
          staff_id: string
          created_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          staff_id: string
          created_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          staff_id?: string
          created_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          role_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          role_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          role_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
