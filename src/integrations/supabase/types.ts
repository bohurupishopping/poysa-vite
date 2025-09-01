export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      bank_reconciliations: {
        Row: {
          account_id: string
          created_at: string
          ending_balance: number
          id: string
          statement_date: string
          status: Database["public"]["Enums"]["reconciliation_status"]
        }
        Insert: {
          account_id: string
          created_at?: string
          ending_balance: number
          id?: string
          statement_date: string
          status?: Database["public"]["Enums"]["reconciliation_status"]
        }
        Update: {
          account_id?: string
          created_at?: string
          ending_balance?: number
          id?: string
          statement_date?: string
          status?: Database["public"]["Enums"]["reconciliation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_payments: {
        Row: {
          amount: number
          bill_id: string
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          payment_date: string
          reference_number: string | null
        }
        Insert: {
          amount: number
          bill_id: string
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date: string
          reference_number?: string | null
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "purchase_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_class: Database["public"]["Enums"]["account_class"]
          account_code: string | null
          account_name: string
          account_type: string | null
          company_id: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          parent_account_id: string | null
        }
        Insert: {
          account_class: Database["public"]["Enums"]["account_class"]
          account_code?: string | null
          account_name: string
          account_type?: string | null
          company_id: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          parent_account_id?: string | null
        }
        Update: {
          account_class?: Database["public"]["Enums"]["account_class"]
          account_code?: string | null
          account_name?: string
          account_type?: string | null
          company_id?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          parent_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          bank_details: Json | null
          business_type: string | null
          cin_number: string | null
          city: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          gstin: string | null
          id: string
          logo_url: string | null
          name: string
          pan_number: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          state_province: string | null
          tan_number: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          bank_details?: Json | null
          business_type?: string | null
          cin_number?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          name: string
          pan_number?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          state_province?: string | null
          tan_number?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          bank_details?: Json | null
          business_type?: string | null
          cin_number?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          pan_number?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          state_province?: string | null
          tan_number?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          company_id: string
          deleted_at: string | null
          details: Json | null
          id: string
          name: string
        }
        Insert: {
          company_id: string
          deleted_at?: string | null
          details?: Json | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          deleted_at?: string | null
          details?: Json | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          address_snapshot: string | null
          company_id: string
          created_at: string
          created_by: string
          id: string
          latitude: number | null
          log_date: string
          log_type: Database["public"]["Enums"]["daily_log_type"]
          longitude: number | null
          notes: string
        }
        Insert: {
          address_snapshot?: string | null
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          latitude?: number | null
          log_date?: string
          log_type?: Database["public"]["Enums"]["daily_log_type"]
          longitude?: number | null
          notes: string
        }
        Update: {
          address_snapshot?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          latitude?: number | null
          log_date?: string
          log_type?: Database["public"]["Enums"]["daily_log_type"]
          longitude?: number | null
          notes?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_assets: {
        Row: {
          accumulated_depreciation_account_id: string
          asset_account_id: string
          asset_name: string
          company_id: string
          id: string
          purchase_date: string
          average_cost: number
        }
        Insert: {
          accumulated_depreciation_account_id: string
          asset_account_id: string
          asset_name: string
          company_id: string
          id?: string
          purchase_date: string
          average_cost: number
        }
        Update: {
          accumulated_depreciation_account_id?: string
          asset_account_id?: string
          asset_name?: string
          company_id?: string
          id?: string
          purchase_date?: string
          average_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixed_assets_accumulated_depreciation_account_id_fkey"
            columns: ["accumulated_depreciation_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_asset_account_id_fkey"
            columns: ["asset_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          id: string
          movement_date: string
          notes: string | null
          product_id: string
          quantity_change: number
          reason: string
          source_document_id: string | null
          warehouse_id: string
        }
        Insert: {
          id?: string
          movement_date?: string
          notes?: string | null
          product_id: string
          quantity_change: number
          reason: string
          source_document_id?: string | null
          warehouse_id: string
        }
        Update: {
          id?: string
          movement_date?: string
          notes?: string | null
          product_id?: string
          quantity_change?: number
          reason?: string
          source_document_id?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          payment_date: string
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date: string
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          company_id: string
          created_at: string
          entry_date: string
          id: string
          narration: string
          source_document_id: string | null
          source_document_type: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          entry_date: string
          id?: string
          narration: string
          source_document_id?: string | null
          source_document_type?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          entry_date?: string
          id?: string
          narration?: string
          source_document_id?: string | null
          source_document_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          credit: number
          debit: number
          id: string
          journal_entry_id: string
          reconciliation_id: string | null
        }
        Insert: {
          account_id: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id: string
          reconciliation_id?: string | null
        }
        Update: {
          account_id?: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id?: string
          reconciliation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "bank_reconciliations"
            referencedColumns: ["id"]
          },
        ]
      }
      log_attachments: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          log_id: string
          mime_type: string | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          log_id: string
          mime_type?: string | null
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          log_id?: string
          mime_type?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_attachments_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_targets: {
        Row: {
          company_id: string
          created_by_role: Database["public"]["Enums"]["target_creator"]
          end_date: string
          id: string
          metric: Database["public"]["Enums"]["target_metric"]
          name: string
          notes: string | null
          period: Database["public"]["Enums"]["target_period"]
          product_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["target_status"]
          target_value: number
        }
        Insert: {
          company_id: string
          created_by_role: Database["public"]["Enums"]["target_creator"]
          end_date: string
          id?: string
          metric: Database["public"]["Enums"]["target_metric"]
          name: string
          notes?: string | null
          period: Database["public"]["Enums"]["target_period"]
          product_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["target_status"]
          target_value: number
        }
        Update: {
          company_id?: string
          created_by_role?: Database["public"]["Enums"]["target_creator"]
          end_date?: string
          id?: string
          metric?: Database["public"]["Enums"]["target_metric"]
          name?: string
          notes?: string | null
          period?: Database["public"]["Enums"]["target_period"]
          product_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["target_status"]
          target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_targets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cogs_account_id: string | null
          company_id: string
          default_tax_group_id: string | null
          deleted_at: string | null
          description: string | null
          hsn_sac_code: string | null
          id: string
          inventory_asset_account_id: string | null
          is_active: boolean
          name: string
          average_cost: number | null
          quantity_on_hand: number
          revenue_account_id: string | null
          sale_price: number | null
          sku: string | null
          type: Database["public"]["Enums"]["product_type"]
        }
        Insert: {
          cogs_account_id?: string | null
          company_id: string
          default_tax_group_id?: string | null
          deleted_at?: string | null
          description?: string | null
          hsn_sac_code?: string | null
          id?: string
          inventory_asset_account_id?: string | null
          is_active?: boolean
          name: string
          average_cost?: number | null
          quantity_on_hand?: number
          revenue_account_id?: string | null
          sale_price?: number | null
          sku?: string | null
          type?: Database["public"]["Enums"]["product_type"]
        }
        Update: {
          cogs_account_id?: string | null
          company_id?: string
          default_tax_group_id?: string | null
          deleted_at?: string | null
          description?: string | null
          hsn_sac_code?: string | null
          id?: string
          inventory_asset_account_id?: string | null
          is_active?: boolean
          name?: string
          average_cost?: number | null
          quantity_on_hand?: number
          revenue_account_id?: string | null
          sale_price?: number | null
          sku?: string | null
          type?: Database["public"]["Enums"]["product_type"]
        }
        Relationships: [
          {
            foreignKeyName: "products_cogs_account_id_fkey"
            columns: ["cogs_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_revenue_account_id_fkey"
            columns: ["revenue_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_kyc: {
        Row: {
          aadhar_card_back_url: string | null
          aadhar_card_front_url: string | null
          aadhar_card_number: string | null
          address: Json | null
          created_at: string
          email: string | null
          id: string
          legal_full_name: string | null
          pan_card_image_url: string | null
          pan_card_number: string | null
          phone_number: string | null
          profile_id: string
          profile_photo_url: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          updated_at: string
        }
        Insert: {
          aadhar_card_back_url?: string | null
          aadhar_card_front_url?: string | null
          aadhar_card_number?: string | null
          address?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          legal_full_name?: string | null
          pan_card_image_url?: string | null
          pan_card_number?: string | null
          phone_number?: string | null
          profile_id: string
          profile_photo_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
        }
        Update: {
          aadhar_card_back_url?: string | null
          aadhar_card_front_url?: string | null
          aadhar_card_number?: string | null
          address?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          legal_full_name?: string | null
          pan_card_image_url?: string | null
          pan_card_number?: string | null
          phone_number?: string | null
          profile_id?: string
          profile_photo_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_kyc_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_references: {
        Row: {
          address: Json | null
          full_name: string
          id: string
          kyc_id: string
          phone_number: string
          reference_type: string
          relationship: string | null
        }
        Insert: {
          address?: Json | null
          full_name: string
          id?: string
          kyc_id: string
          phone_number: string
          reference_type: string
          relationship?: string | null
        }
        Update: {
          address?: Json | null
          full_name?: string
          id?: string
          kyc_id?: string
          phone_number?: string
          reference_type?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_references_kyc_id_fkey"
            columns: ["kyc_id"]
            isOneToOne: false
            referencedRelation: "profile_kyc"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_bill_lines: {
        Row: {
          bill_id: string
          description: string
          id: string
          line_total: number
          product_id: string | null
          quantity: number
          tax_rate_id: string | null
          unit_price: number
        }
        Insert: {
          bill_id: string
          description: string
          id?: string
          line_total: number
          product_id?: string | null
          quantity: number
          tax_rate_id?: string | null
          unit_price: number
        }
        Update: {
          bill_id?: string
          description?: string
          id?: string
          line_total?: number
          product_id?: string | null
          quantity?: number
          tax_rate_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_bill_lines_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "purchase_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_bill_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_bill_lines_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_bills: {
        Row: {
          amount_paid: number
          bill_date: string
          bill_number: string | null
          company_id: string
          due_date: string | null
          id: string
          status: Database["public"]["Enums"]["bill_status"]
          subtotal: number
          supplier_id: string
          total_amount: number
          total_tax: number
        }
        Insert: {
          amount_paid?: number
          bill_date: string
          bill_number?: string | null
          company_id: string
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["bill_status"]
          subtotal: number
          supplier_id: string
          total_amount: number
          total_tax?: number
        }
        Update: {
          amount_paid?: number
          bill_date?: string
          bill_number?: string | null
          company_id?: string
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["bill_status"]
          subtotal?: number
          supplier_id?: string
          total_amount?: number
          total_tax?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_bills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_bills_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          shipping_address: string | null
          status: Database["public"]["Enums"]["po_status"]
          subtotal: number
          supplier_id: string
          terms_and_conditions: string | null
          total_amount: number
          total_tax: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number: string
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          subtotal: number
          supplier_id: string
          terms_and_conditions?: string | null
          total_amount: number
          total_tax?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          subtotal?: number
          supplier_id?: string
          terms_and_conditions?: string | null
          total_amount?: number
          total_tax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_lines: {
        Row: {
          description: string
          hsn_sac_code: string | null
          id: string
          line_total: number
          po_id: string
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          description: string
          hsn_sac_code?: string | null
          id?: string
          line_total: number
          po_id: string
          product_id?: string | null
          quantity: number
          unit_price: number
        }
        Update: {
          description?: string
          hsn_sac_code?: string | null
          id?: string
          line_total?: number
          po_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_line_taxes: {
        Row: {
          id: string
          po_line_id: string
          tax_amount: number
          tax_rate_id: string
        }
        Insert: {
          id?: string
          po_line_id: string
          tax_amount?: number
          tax_rate_id: string
        }
        Update: {
          id?: string
          po_line_id?: string
          tax_amount?: number
          tax_rate_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_line_taxes_po_line_id_fkey"
            columns: ["po_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_line_taxes_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoice_lines: {
        Row: {
          description: string
          id: string
          invoice_id: string
          line_total: number
          product_id: string | null
          quantity: number
          tax_rate_id: string | null
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          line_total: number
          product_id?: string | null
          quantity: number
          tax_rate_id?: string | null
          unit_price: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number
          product_id?: string | null
          quantity?: number
          tax_rate_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoice_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoice_lines_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoices: {
        Row: {
          amount_paid: number
          company_id: string
          customer_id: string
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total_amount: number
          total_tax: number
        }
        Insert: {
          amount_paid?: number
          company_id: string
          customer_id: string
          due_date?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total_amount: number
          total_tax?: number
        }
        Update: {
          amount_paid?: number
          company_id?: string
          customer_id?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total_amount?: number
          total_tax?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          company_id: string
          deleted_at: string | null
          details: Json | null
          id: string
          name: string
        }
        Insert: {
          company_id: string
          deleted_at?: string | null
          details?: Json | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          deleted_at?: string | null
          details?: Json | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rates: {
        Row: {
          company_id: string
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          rate: number
        }
        Insert: {
          company_id: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          rate: number
        }
        Update: {
          company_id?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          company_id: string
          deleted_at: string | null
          id: string
          is_active: boolean
          location: string | null
          name: string
        }
        Insert: {
          company_id: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
        }
        Update: {
          company_id?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_bank_accounts: {
        Row: {
          id: string
          company_id: string
          chart_of_account_id: string
          account_name: string
          account_type: Database["public"]["Enums"]["cash_bank_account_type"]
          account_details: Json | null
          is_active: boolean
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          chart_of_account_id: string
          account_name: string
          account_type: Database["public"]["Enums"]["cash_bank_account_type"]
          account_details?: Json | null
          is_active?: boolean
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          chart_of_account_id?: string
          account_name?: string
          account_type?: Database["public"]["Enums"]["cash_bank_account_type"]
          account_details?: Json | null
          is_active?: boolean
          created_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_bank_accounts_chart_of_account_id_fkey"
            columns: ["chart_of_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_proposals: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          profile_id: string
          full_name: string
          email: string
          phone: string
          address_line_1: string
          address_line_2: string | null
          city: string
          state_province: string
          postal_code: string
          country: string
          company_name: string
          is_gst_registered: boolean
          gstin: string | null
          document_urls: string[]
          status: Database["public"]["Enums"]["proposal_status"]
          admin_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          profile_id: string
          full_name: string
          email: string
          phone: string
          address_line_1: string
          address_line_2?: string | null
          city: string
          state_province: string
          postal_code: string
          country?: string
          company_name: string
          is_gst_registered?: boolean
          gstin?: string | null
          document_urls?: string[]
          status?: Database["public"]["Enums"]["proposal_status"]
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          profile_id?: string
          full_name?: string
          email?: string
          phone?: string
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          state_province?: string
          postal_code?: string
          country?: string
          company_name?: string
          is_gst_registered?: boolean
          gstin?: string | null
          document_urls?: string[]
          status?: Database["public"]["Enums"]["proposal_status"]
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_proposals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          id: string
          company_id: string
          customer_id: string
          estimate_number: string
          estimate_date: string
          expiry_date: string | null
          status: Database["public"]["Enums"]["estimate_status"]
          subtotal: number
          total_tax: number
          total_amount: number
          notes: string | null
          terms_and_conditions: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          customer_id: string
          estimate_number: string
          estimate_date?: string
          expiry_date?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          subtotal: number
          total_tax?: number
          total_amount: number
          notes?: string | null
          terms_and_conditions?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          customer_id?: string
          estimate_number?: string
          estimate_date?: string
          expiry_date?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          subtotal?: number
          total_tax?: number
          total_amount?: number
          notes?: string | null
          terms_and_conditions?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_lines: {
        Row: {
          id: string
          estimate_id: string
          product_id: string | null
          description: string
          quantity: number
          unit_price: number
          line_total: number
          hsn_sac_code: string | null
        }
        Insert: {
          id?: string
          estimate_id: string
          product_id?: string | null
          description: string
          quantity: number
          unit_price: number
          line_total: number
          hsn_sac_code?: string | null
        }
        Update: {
          id?: string
          estimate_id?: string
          product_id?: string | null
          description?: string
          quantity?: number
          unit_price?: number
          line_total?: number
          hsn_sac_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_lines_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_line_taxes: {
        Row: {
          id: string
          estimate_line_id: string
          tax_rate_id: string
          tax_amount: number
        }
        Insert: {
          id?: string
          estimate_line_id: string
          tax_rate_id: string
          tax_amount?: number
        }
        Update: {
          id?: string
          estimate_line_id?: string
          tax_rate_id?: string
          tax_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_line_taxes_estimate_line_id_fkey"
            columns: ["estimate_line_id"]
            isOneToOne: false
            referencedRelation: "estimate_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_taxes_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_targets: {
        Row: {
          id: string
          company_id: string
          name: string
          metric: Database["public"]["Enums"]["target_metric"]
          target_value: number
          period: Database["public"]["Enums"]["target_period"]
          start_date: string
          end_date: string
          product_id: string | null
          description: string | null
          status: Database["public"]["Enums"]["target_status"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          metric: Database["public"]["Enums"]["target_metric"]
          target_value: number
          period: Database["public"]["Enums"]["target_period"]
          start_date: string
          end_date: string
          product_id?: string | null
          description?: string | null
          status?: Database["public"]["Enums"]["target_status"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          metric?: Database["public"]["Enums"]["target_metric"]
          target_value?: number
          period?: Database["public"]["Enums"]["target_period"]
          start_date?: string
          end_date?: string
          product_id?: string | null
          description?: string | null
          status?: Database["public"]["Enums"]["target_status"]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_targets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_next_document_number: {
        Args: {
          p_company_id: string;
          p_document_type: string;
          p_date: string;
        };
        Returns: string;
      };
      submit_purchase_bill: {
        Args: {
          p_company_id: string;
          p_supplier_id: string;
          p_bill_date: string;
          p_lines: Json;
          p_existing_bill_id?: string;
          p_bill_number?: string;
          p_due_date?: string;
          p_place_of_supply?: string;
        };
        Returns: Json;
      };
      submit_sales_invoice: {
        Args: {
          p_company_id: string;
          p_customer_id: string;
          p_invoice_number: string;
          p_invoice_date: string;
          p_lines: Json;
          p_existing_invoice_id?: string;
          p_due_date?: string;
          p_place_of_supply?: string;
        };
        Returns: Json;
      };
      submit_estimate: {
        Args: {
          p_company_id: string;
          p_customer_id: string;
          p_estimate_number: string;
          p_estimate_date: string;
          p_lines: Json;
          p_existing_estimate_id?: string;
          p_expiry_date?: string;
          p_notes?: string;
          p_terms_and_conditions?: string;
        };
        Returns: Json;
      };
      create_invoice_from_estimate: {
        Args: {
          p_estimate_id: string;
          p_invoice_number: string;
          p_invoice_date: string;
          p_due_date?: string;
        };
        Returns: Json;
      };
      get_company_purchase_bills_paginated: {
        Args: {
          p_company_id: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Json[];
      };
      get_purchase_bill_with_details: {
        Args: {
          p_bill_id: string;
        };
        Returns: Json[];
      };
      get_customer_statement: {
        Args: {
          p_customer_id: string;
          p_start_date: string;
          p_end_date: string;
        };
        Returns: Json[];
      };
      get_supplier_statement: {
        Args: {
          p_supplier_id: string;
          p_start_date: string;
          p_end_date: string;
        };
        Returns: Json[];
      };
      get_cash_bank_balance: {
        Args: {
          p_cash_bank_account_id: string;
          p_as_of_date: string;
        };
        Returns: number;
      };
      get_sales_target_performance: {
        Args: {
          p_target_id: string;
        };
        Returns: Json;
      };
    }
    Enums: {
      account_class: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
      app_role: "admin" | "manager" | "user"
      bill_status: "draft" | "submitted" | "paid" | "partially_paid" | "void"
      daily_log_type:
      | "GENERAL_UPDATE"
      | "SITE_VISIT"
      | "CLIENT_MEETING"
      | "SUPPLIER_MEETING"
      | "INCIDENT_REPORT"
      invoice_status: "draft" | "sent" | "paid" | "partially_paid" | "void"
      kyc_status: "not_submitted" | "pending_review" | "approved" | "rejected"
      payment_method:
      | "cash"
      | "bank_transfer"
      | "credit_card"
      | "cheque"
      | "other"
      product_type: "GOOD" | "SERVICE"
      proposal_status: "pending" | "under_review" | "approved" | "rejected"
      reconciliation_status: "in_progress" | "completed" | "cancelled"
      target_creator: "ADMIN" | "MANAGER"
      target_metric: "REVENUE" | "PROFIT" | "QUANTITY_SOLD"
      target_period: "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM"
      target_status: "ACTIVE" | "ACHIEVED" | "MISSED"
      estimate_status: "draft" | "sent" | "accepted" | "declined" | "expired"
      po_status: "draft" | "sent" | "approved" | "closed" | "cancelled"
      cash_bank_account_type: "Bank" | "Cash"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      account_class: ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"],
      app_role: ["admin", "manager", "user"],
      bill_status: ["draft", "submitted", "paid", "partially_paid", "void"],
      daily_log_type: [
        "GENERAL_UPDATE",
        "SITE_VISIT",
        "CLIENT_MEETING",
        "SUPPLIER_MEETING",
        "INCIDENT_REPORT",
      ],
      invoice_status: ["draft", "sent", "paid", "partially_paid", "void"],
      kyc_status: ["not_submitted", "pending_review", "approved", "rejected"],
      payment_method: [
        "cash",
        "bank_transfer",
        "credit_card",
        "cheque",
        "other",
      ],
      product_type: ["GOOD", "SERVICE"],
      proposal_status: ["pending", "under_review", "approved", "rejected"],
      reconciliation_status: ["in_progress", "completed", "cancelled"],
      target_creator: ["ADMIN", "MANAGER"],
      target_metric: ["REVENUE", "PROFIT", "QUANTITY_SOLD"],
      target_period: ["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"],
      target_status: ["ACTIVE", "ACHIEVED", "MISSED"],
      estimate_status: ["draft", "sent", "accepted", "declined", "expired"],
      po_status: ["draft", "sent", "confirmed", "partially_received", "received", "cancelled"],
    },
  },
} as const
