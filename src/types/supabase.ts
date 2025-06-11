//src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      adapter_panels: {
        Row: {
          adapter_color: string | null
          brand: string
          brand_normalized: string | null
          category: string | null
          color: string | null
          common_terms: string | null
          compatible_enclosures: string | null
          connector_type: string | null
          created_at: string | null
          created_by: string | null
          distributor_part_number: string | null
          fiber_category: string | null
          fiber_count: number | null
          go_with_items: string | null
          housing_material: string | null
          id: number
          image_file: string | null
          insertion_loss: string | null
          is_active: boolean | null
          keying: string | null
          last_modified_by: string | null
          number_of_adapter_per_panel: number | null
          panel_type: string | null
          part_number: string
          polarity: string | null
          possible_equivalent: string | null
          product_line: string | null
          return_loss: string | null
          search_vector: unknown | null
          short_description: string | null
          split_sleeve_type: string | null
          supports_apc: boolean | null
          termination_type: string | null
          upc_number: string | null
          updated_at: string | null
        }
        Insert: {
          adapter_color?: string | null
          brand: string
          brand_normalized?: string | null
          category?: string | null
          color?: string | null
          common_terms?: string | null
          compatible_enclosures?: string | null
          connector_type?: string | null
          created_at?: string | null
          created_by?: string | null
          distributor_part_number?: string | null
          fiber_category?: string | null
          fiber_count?: number | null
          go_with_items?: string | null
          housing_material?: string | null
          id: number
          image_file?: string | null
          insertion_loss?: string | null
          is_active?: boolean | null
          keying?: string | null
          last_modified_by?: string | null
          number_of_adapter_per_panel?: number | null
          panel_type?: string | null
          part_number: string
          polarity?: string | null
          possible_equivalent?: string | null
          product_line?: string | null
          return_loss?: string | null
          search_vector?: unknown | null
          short_description?: string | null
          split_sleeve_type?: string | null
          supports_apc?: boolean | null
          termination_type?: string | null
          upc_number?: string | null
          updated_at?: string | null
        }
        Update: {
          adapter_color?: string | null
          brand?: string
          brand_normalized?: string | null
          category?: string | null
          color?: string | null
          common_terms?: string | null
          compatible_enclosures?: string | null
          connector_type?: string | null
          created_at?: string | null
          created_by?: string | null
          distributor_part_number?: string | null
          fiber_category?: string | null
          fiber_count?: number | null
          go_with_items?: string | null
          housing_material?: string | null
          id?: number
          image_file?: string | null
          insertion_loss?: string | null
          is_active?: boolean | null
          keying?: string | null
          last_modified_by?: string | null
          number_of_adapter_per_panel?: number | null
          panel_type?: string | null
          part_number?: string
          polarity?: string | null
          possible_equivalent?: string | null
          product_line?: string | null
          return_loss?: string | null
          search_vector?: unknown | null
          short_description?: string | null
          split_sleeve_type?: string | null
          supports_apc?: boolean | null
          termination_type?: string | null
          upc_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      branch_locations: {
        Row: {
          address: string
          branch_number: string
          city: string
          distributor_id: number
          id: number
          location_name: string
          location_type_id: number | null
          state: string
          zip_code: string
        }
        Insert: {
          address: string
          branch_number: string
          city: string
          distributor_id: number
          id: number
          location_name: string
          location_type_id?: number | null
          state: string
          zip_code: string
        }
        Update: {
          address?: string
          branch_number?: string
          city?: string
          distributor_id?: number
          id?: number
          location_name?: string
          location_type_id?: number | null
          state?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_locations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_locations_location_type_id_fkey"
            columns: ["location_type_id"]
            isOneToOne: false
            referencedRelation: "location_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_branch_distributor"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: string
          is_active: boolean | null
          level: number | null
          name: string
          parent_category_id: string | null
          search_keywords: string[] | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          level?: number | null
          name: string
          parent_category_id?: string | null
          search_keywords?: string[] | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          level?: number | null
          name?: string
          parent_category_id?: string | null
          search_keywords?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_cables: {
        Row: {
          application: string | null
          approvals_listings: string | null
          brand: string | null
          brand_normalized: string | null
          cable_diameter_in: number | null
          category_rating: string | null
          common_terms: string | null
          compatible_connectors: string | null
          conductor_awg: number | null
          conductor_type: string | null
          created_at: string | null
          go_with_items: string | null
          id: number
          image_file: string | null
          installation_tools_required: string | null
          is_active: boolean | null
          jacket_code: string | null
          jacket_color: string | null
          jacket_material: string | null
          length: string | null
          packaging_type: string | null
          pair_count: string | null
          part_number: string
          possible_cross: string | null
          product_line: string | null
          search_vector: unknown | null
          Shielding_Type: string | null
          short_description: string | null
          temperature_range_operation: string | null
          upc_number: string | null
          updated_at: string | null
          warehouses: string | null
        }
        Insert: {
          application?: string | null
          approvals_listings?: string | null
          brand?: string | null
          brand_normalized?: string | null
          cable_diameter_in?: number | null
          category_rating?: string | null
          common_terms?: string | null
          compatible_connectors?: string | null
          conductor_awg?: number | null
          conductor_type?: string | null
          created_at?: string | null
          go_with_items?: string | null
          id: number
          image_file?: string | null
          installation_tools_required?: string | null
          is_active?: boolean | null
          jacket_code?: string | null
          jacket_color?: string | null
          jacket_material?: string | null
          length?: string | null
          packaging_type?: string | null
          pair_count?: string | null
          part_number: string
          possible_cross?: string | null
          product_line?: string | null
          search_vector?: unknown | null
          Shielding_Type?: string | null
          short_description?: string | null
          temperature_range_operation?: string | null
          upc_number?: string | null
          updated_at?: string | null
          warehouses?: string | null
        }
        Update: {
          application?: string | null
          approvals_listings?: string | null
          brand?: string | null
          brand_normalized?: string | null
          cable_diameter_in?: number | null
          category_rating?: string | null
          common_terms?: string | null
          compatible_connectors?: string | null
          conductor_awg?: number | null
          conductor_type?: string | null
          created_at?: string | null
          go_with_items?: string | null
          id?: number
          image_file?: string | null
          installation_tools_required?: string | null
          is_active?: boolean | null
          jacket_code?: string | null
          jacket_color?: string | null
          jacket_material?: string | null
          length?: string | null
          packaging_type?: string | null
          pair_count?: string | null
          part_number?: string
          possible_cross?: string | null
          product_line?: string | null
          search_vector?: unknown | null
          Shielding_Type?: string | null
          short_description?: string | null
          temperature_range_operation?: string | null
          upc_number?: string | null
          updated_at?: string | null
          warehouses?: string | null
        }
        Relationships: []
      }
      compatible_products: {
        Row: {
          compatibility_notes: string | null
          compatibility_type: string | null
          compatible_id: number
          compatible_type: string
          created_at: string | null
          id: number
          product_id: number
          product_type: string
        }
        Insert: {
          compatibility_notes?: string | null
          compatibility_type?: string | null
          compatible_id: number
          compatible_type: string
          created_at?: string | null
          id?: number
          product_id: number
          product_type: string
        }
        Update: {
          compatibility_notes?: string | null
          compatibility_type?: string | null
          compatible_id?: number
          compatible_type?: string
          created_at?: string | null
          id?: number
          product_id?: number
          product_type?: string
        }
        Relationships: []
      }
      customer_list_items: {
        Row: {
          added_by: string | null
          added_date: string | null
          id: number
          item_notes: string | null
          list_id: string
          part_number: string
          product_description: string | null
          product_id: string
          product_table: string
          quantity: number | null
          sort_order: number | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          added_by?: string | null
          added_date?: string | null
          id?: number
          item_notes?: string | null
          list_id: string
          part_number: string
          product_description?: string | null
          product_id: string
          product_table: string
          quantity?: number | null
          sort_order?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          added_by?: string | null
          added_date?: string | null
          id?: number
          item_notes?: string | null
          list_id?: string
          part_number?: string
          product_description?: string | null
          product_id?: string
          product_table?: string
          quantity?: number | null
          sort_order?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "customer_product_lists"
            referencedColumns: ["list_id"]
          },
        ]
      }
      customer_product_lists: {
        Row: {
          created_date: string | null
          customer_company: string | null
          customer_email: string | null
          customer_name: string | null
          expiry_date: string | null
          id: number
          include_datasheets: boolean | null
          include_pricing: boolean | null
          is_active: boolean | null
          last_viewed: string | null
          list_id: string
          list_name: string
          list_status: string | null
          notes: string | null
          project_name: string | null
          sales_rep_email: string | null
          sales_rep_name: string | null
          sent_date: string | null
        }
        Insert: {
          created_date?: string | null
          customer_company?: string | null
          customer_email?: string | null
          customer_name?: string | null
          expiry_date?: string | null
          id?: number
          include_datasheets?: boolean | null
          include_pricing?: boolean | null
          is_active?: boolean | null
          last_viewed?: string | null
          list_id: string
          list_name: string
          list_status?: string | null
          notes?: string | null
          project_name?: string | null
          sales_rep_email?: string | null
          sales_rep_name?: string | null
          sent_date?: string | null
        }
        Update: {
          created_date?: string | null
          customer_company?: string | null
          customer_email?: string | null
          customer_name?: string | null
          expiry_date?: string | null
          id?: number
          include_datasheets?: boolean | null
          include_pricing?: boolean | null
          is_active?: boolean | null
          last_viewed?: string | null
          list_id?: string
          list_name?: string
          list_status?: string | null
          notes?: string | null
          project_name?: string | null
          sales_rep_email?: string | null
          sales_rep_name?: string | null
          sent_date?: string | null
        }
        Relationships: []
      }
      distributor_inventory: {
        Row: {
          branch_location_id: number
          cost_price: number | null
          created_at: string | null
          description: string
          distributor_id: number
          file_source: string | null
          id: number
          import_batch_id: string
          import_date: string
          is_active: boolean | null
          last_updated: string | null
          manufacturer_name: string | null
          manufacturer_part_number: string | null
          part_number: string
          product_category: string | null
          quantity_on_hand: number | null
          short_description: string | null
          unit_price: number | null
        }
        Insert: {
          branch_location_id: number
          cost_price?: number | null
          created_at?: string | null
          description: string
          distributor_id: number
          file_source?: string | null
          id?: number
          import_batch_id: string
          import_date: string
          is_active?: boolean | null
          last_updated?: string | null
          manufacturer_name?: string | null
          manufacturer_part_number?: string | null
          part_number: string
          product_category?: string | null
          quantity_on_hand?: number | null
          short_description?: string | null
          unit_price?: number | null
        }
        Update: {
          branch_location_id?: number
          cost_price?: number | null
          created_at?: string | null
          description?: string
          distributor_id?: number
          file_source?: string | null
          id?: number
          import_batch_id?: string
          import_date?: string
          is_active?: boolean | null
          last_updated?: string | null
          manufacturer_name?: string | null
          manufacturer_part_number?: string | null
          part_number?: string
          product_category?: string | null
          quantity_on_hand?: number | null
          short_description?: string | null
          unit_price?: number | null
        }
        Relationships: []
      }
      distributors: {
        Row: {
          distributor_name: string
          id: number
        }
        Insert: {
          distributor_name: string
          id: number
        }
        Update: {
          distributor_name?: string
          id?: number
        }
        Relationships: []
      }
      fiber_connectors: {
        Row: {
          boot_color: string | null
          brand: string
          brand_normalized: string | null
          category: string | null
          common_terms: string | null
          connector_type: string | null
          created_at: string | null
          created_by: string | null
          distributor_part_number: string | null
          ferrule_material: string | null
          fiber_category: string | null
          fiber_count: number | null
          go_with_items: string | null
          housing_color: string | null
          id: number
          installation_tools_required: string | null
          is_active: boolean | null
          last_modified_by: string | null
          packaging_method: string | null
          part_number: string
          polish: string | null
          possible_equivalent: string | null
          product_line: string | null
          product_type: string | null
          requires_splice_tray: boolean | null
          search_vector: unknown | null
          short_description: string | null
          technology: string | null
          temperature_range_operation: string | null
          upc_number: string | null
          updated_at: string | null
        }
        Insert: {
          boot_color?: string | null
          brand: string
          brand_normalized?: string | null
          category?: string | null
          common_terms?: string | null
          connector_type?: string | null
          created_at?: string | null
          created_by?: string | null
          distributor_part_number?: string | null
          ferrule_material?: string | null
          fiber_category?: string | null
          fiber_count?: number | null
          go_with_items?: string | null
          housing_color?: string | null
          id: number
          installation_tools_required?: string | null
          is_active?: boolean | null
          last_modified_by?: string | null
          packaging_method?: string | null
          part_number: string
          polish?: string | null
          possible_equivalent?: string | null
          product_line?: string | null
          product_type?: string | null
          requires_splice_tray?: boolean | null
          search_vector?: unknown | null
          short_description?: string | null
          technology?: string | null
          temperature_range_operation?: string | null
          upc_number?: string | null
          updated_at?: string | null
        }
        Update: {
          boot_color?: string | null
          brand?: string
          brand_normalized?: string | null
          category?: string | null
          common_terms?: string | null
          connector_type?: string | null
          created_at?: string | null
          created_by?: string | null
          distributor_part_number?: string | null
          ferrule_material?: string | null
          fiber_category?: string | null
          fiber_count?: number | null
          go_with_items?: string | null
          housing_color?: string | null
          id?: number
          installation_tools_required?: string | null
          is_active?: boolean | null
          last_modified_by?: string | null
          packaging_method?: string | null
          part_number?: string
          polish?: string | null
          possible_equivalent?: string | null
          product_line?: string | null
          product_type?: string | null
          requires_splice_tray?: boolean | null
          search_vector?: unknown | null
          short_description?: string | null
          technology?: string | null
          temperature_range_operation?: string | null
          upc_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fiber_optic_cable: {
        Row: {
          applications: string | null
          bandwidth: string | null
          brand: string
          category: string | null
          color: string | null
          common_terms: string | null
          created_at: string | null
          created_by: string | null
          distributor_part_number: string | null
          fiber_category: string | null
          fiber_count: number | null
          go_with_items: string | null
          id: number
          image_file: string | null
          is_active: boolean | null
          jacket_rating: string | null
          last_modified_by: string | null
          mayer_part_number: string | null
          part_number: string
          possible_equivalent: string | null
          product_type: string | null
          search_vector: unknown | null
          short_description: string | null
          upc_number: string | null
          updated_at: string | null
        }
        Insert: {
          applications?: string | null
          bandwidth?: string | null
          brand: string
          category?: string | null
          color?: string | null
          common_terms?: string | null
          created_at?: string | null
          created_by?: string | null
          distributor_part_number?: string | null
          fiber_category?: string | null
          fiber_count?: number | null
          go_with_items?: string | null
          id: number
          image_file?: string | null
          is_active?: boolean | null
          jacket_rating?: string | null
          last_modified_by?: string | null
          mayer_part_number?: string | null
          part_number: string
          possible_equivalent?: string | null
          product_type?: string | null
          search_vector?: unknown | null
          short_description?: string | null
          upc_number?: string | null
          updated_at?: string | null
        }
        Update: {
          applications?: string | null
          bandwidth?: string | null
          brand?: string
          category?: string | null
          color?: string | null
          common_terms?: string | null
          created_at?: string | null
          created_by?: string | null
          distributor_part_number?: string | null
          fiber_category?: string | null
          fiber_count?: number | null
          go_with_items?: string | null
          id?: number
          image_file?: string | null
          is_active?: boolean | null
          jacket_rating?: string | null
          last_modified_by?: string | null
          mayer_part_number?: string | null
          part_number?: string
          possible_equivalent?: string | null
          product_type?: string | null
          search_vector?: unknown | null
          short_description?: string | null
          upc_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      go_with_items: {
        Row: {
          created_at: string | null
          id: number
          parent_item_id: number
          parent_table: string
          related_brand: string
          related_part_number: string
          relationship_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          parent_item_id: number
          parent_table: string
          related_brand: string
          related_part_number: string
          relationship_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          parent_item_id?: number
          parent_table?: string
          related_brand?: string
          related_part_number?: string
          relationship_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      import_batches: {
        Row: {
          batch_id: string
          completed_at: string | null
          created_by: string | null
          distributor_id: number
          error_log: string | null
          failed_records: number | null
          file_name: string | null
          id: number
          import_date: string
          import_status: string | null
          started_at: string | null
          successful_records: number | null
          total_records: number | null
        }
        Insert: {
          batch_id: string
          completed_at?: string | null
          created_by?: string | null
          distributor_id: number
          error_log?: string | null
          failed_records?: number | null
          file_name?: string | null
          id?: number
          import_date: string
          import_status?: string | null
          started_at?: string | null
          successful_records?: number | null
          total_records?: number | null
        }
        Update: {
          batch_id?: string
          completed_at?: string | null
          created_by?: string | null
          distributor_id?: number
          error_log?: string | null
          failed_records?: number | null
          file_name?: string | null
          id?: number
          import_date?: string
          import_status?: string | null
          started_at?: string | null
          successful_records?: number | null
          total_records?: number | null
        }
        Relationships: []
      }
      location_types: {
        Row: {
          description: string | null
          id: number
          serves_customers: boolean | null
          supports_branches: boolean | null
          type_name: string
        }
        Insert: {
          description?: string | null
          id?: number
          serves_customers?: boolean | null
          supports_branches?: boolean | null
          type_name: string
        }
        Update: {
          description?: string | null
          id?: number
          serves_customers?: boolean | null
          supports_branches?: boolean | null
          type_name?: string
        }
        Relationships: []
      }
      manufacturers: {
        Row: {
          contact_info: Json | null
          created_at: string | null
          id: number
          is_active: boolean | null
          name: string
          website_url: string | null
        }
        Insert: {
          contact_info?: Json | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          website_url?: string | null
        }
        Update: {
          contact_info?: Json | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
      product_attributes: {
        Row: {
          attribute_name: string
          attribute_type: string | null
          attribute_value: string | null
          display_order: number | null
          id: string
          is_searchable: boolean | null
          product_id: string | null
        }
        Insert: {
          attribute_name: string
          attribute_type?: string | null
          attribute_value?: string | null
          display_order?: number | null
          id?: string
          is_searchable?: boolean | null
          product_id?: string | null
        }
        Update: {
          attribute_name?: string
          attribute_type?: string | null
          attribute_value?: string | null
          display_order?: number | null
          id?: string
          is_searchable?: boolean | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      product_datasheet_links: {
        Row: {
          created_at: string | null
          created_by: string | null
          datasheet_id: string
          id: number
          link_type: string | null
          notes: string | null
          part_number: string
          product_id: string
          product_table: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          datasheet_id: string
          id?: number
          link_type?: string | null
          notes?: string | null
          part_number: string
          product_id: string
          product_table: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          datasheet_id?: string
          id?: number
          link_type?: string | null
          notes?: string | null
          part_number?: string
          product_id?: string
          product_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_datasheet_links_datasheet_id_fkey"
            columns: ["datasheet_id"]
            isOneToOne: false
            referencedRelation: "product_datasheets"
            referencedColumns: ["datasheet_id"]
          },
        ]
      }
      product_datasheets: {
        Row: {
          datasheet_id: string
          document_category: string | null
          document_date: string | null
          document_description: string | null
          document_title: string | null
          document_version: string | null
          download_count: number | null
          file_size_bytes: number | null
          file_type: string
          file_url: string
          id: number
          is_active: boolean | null
          last_accessed: string | null
          manufacturer: string | null
          notes: string | null
          original_filename: string
          product_family: string | null
          upload_date: string | null
          uploaded_by: string | null
        }
        Insert: {
          datasheet_id: string
          document_category?: string | null
          document_date?: string | null
          document_description?: string | null
          document_title?: string | null
          document_version?: string | null
          download_count?: number | null
          file_size_bytes?: number | null
          file_type: string
          file_url: string
          id?: number
          is_active?: boolean | null
          last_accessed?: string | null
          manufacturer?: string | null
          notes?: string | null
          original_filename: string
          product_family?: string | null
          upload_date?: string | null
          uploaded_by?: string | null
        }
        Update: {
          datasheet_id?: string
          document_category?: string | null
          document_date?: string | null
          document_description?: string | null
          document_title?: string | null
          document_version?: string | null
          download_count?: number | null
          file_size_bytes?: number | null
          file_type?: string
          file_url?: string
          id?: number
          is_active?: boolean | null
          last_accessed?: string | null
          manufacturer?: string | null
          notes?: string | null
          original_filename?: string
          product_family?: string | null
          upload_date?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          attributes: Json | null
          category_id: string | null
          color: string | null
          connector_type_standard: string | null
          cost_price: number | null
          created_at: string | null
          datasheet_url: string | null
          detailed_description: string | null
          distributor_id: number
          embedding: string | null
          fiber_count: number | null
          fiber_type_standard: string | null
          id: string
          image_urls: string[] | null
          is_active: boolean | null
          jacket_rating_standard: string | null
          manufacturer_id: number | null
          part_number: string
          search_text: string | null
          short_description: string | null
          stock_quantity: number | null
          unit_price: number | null
          upc_number: string | null
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          category_id?: string | null
          color?: string | null
          connector_type_standard?: string | null
          cost_price?: number | null
          created_at?: string | null
          datasheet_url?: string | null
          detailed_description?: string | null
          distributor_id: number
          embedding?: string | null
          fiber_count?: number | null
          fiber_type_standard?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          jacket_rating_standard?: string | null
          manufacturer_id?: number | null
          part_number: string
          search_text?: string | null
          short_description?: string | null
          stock_quantity?: number | null
          unit_price?: number | null
          upc_number?: string | null
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          category_id?: string | null
          color?: string | null
          connector_type_standard?: string | null
          cost_price?: number | null
          created_at?: string | null
          datasheet_url?: string | null
          detailed_description?: string | null
          distributor_id?: number
          embedding?: string | null
          fiber_count?: number | null
          fiber_type_standard?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          jacket_rating_standard?: string | null
          manufacturer_id?: number | null
          part_number?: string
          search_text?: string | null
          short_description?: string | null
          stock_quantity?: number | null
          unit_price?: number | null
          upc_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_products_distributor"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_products_manufacturer"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          avg_response_time_ms: number | null
          category: string
          created_at: string | null
          created_by: string | null
          customer_satisfaction: number | null
          description: string | null
          escalation_rate: number | null
          filter_config: Json | null
          id: string
          is_active: boolean | null
          last_modified_by: string | null
          max_tokens: number | null
          name: string
          notes: string | null
          prompt_text: string
          search_keywords: string[] | null
          success_rate: number | null
          system_context: Json | null
          tags: string[] | null
          temperature: number | null
          title: string
          updated_at: string | null
          usage_count: number | null
          version: number | null
        }
        Insert: {
          avg_response_time_ms?: number | null
          category: string
          created_at?: string | null
          created_by?: string | null
          customer_satisfaction?: number | null
          description?: string | null
          escalation_rate?: number | null
          filter_config?: Json | null
          id?: string
          is_active?: boolean | null
          last_modified_by?: string | null
          max_tokens?: number | null
          name: string
          notes?: string | null
          prompt_text: string
          search_keywords?: string[] | null
          success_rate?: number | null
          system_context?: Json | null
          tags?: string[] | null
          temperature?: number | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
          version?: number | null
        }
        Update: {
          avg_response_time_ms?: number | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          customer_satisfaction?: number | null
          description?: string | null
          escalation_rate?: number | null
          filter_config?: Json | null
          id?: string
          is_active?: boolean | null
          last_modified_by?: string | null
          max_tokens?: number | null
          name?: string
          notes?: string | null
          prompt_text?: string
          search_keywords?: string[] | null
          success_rate?: number | null
          system_context?: Json | null
          tags?: string[] | null
          temperature?: number | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
          version?: number | null
        }
        Relationships: []
      }
      rack_mount_fiber_enclosures: {
        Row: {
          accepts_number_of_connector_housing_panels: number | null
          brand: string
          brand_normalized: string | null
          category: string | null
          color: string | null
          common_terms: string | null
          created_at: string | null
          created_by: string | null
          environment: string | null
          fiber_enclosure_splice_tray: string | null
          go_with_items: string | null
          id: number
          image_file: string | null
          is_active: boolean | null
          last_modified_by: string | null
          material: string | null
          max_fiber_capacity: number | null
          mayer_part_number: string | null
          mount_type: string | null
          panel_type: string | null
          part_number: string
          possible_equivalent: string | null
          product_line: string | null
          product_type: string | null
          rack_compatibility: string | null
          rack_units: number | null
          search_vector: unknown | null
          short_description: string | null
          supports_splice_trays: boolean | null
          upc_number: string | null
          updated_at: string | null
        }
        Insert: {
          accepts_number_of_connector_housing_panels?: number | null
          brand: string
          brand_normalized?: string | null
          category?: string | null
          color?: string | null
          common_terms?: string | null
          created_at?: string | null
          created_by?: string | null
          environment?: string | null
          fiber_enclosure_splice_tray?: string | null
          go_with_items?: string | null
          id: number
          image_file?: string | null
          is_active?: boolean | null
          last_modified_by?: string | null
          material?: string | null
          max_fiber_capacity?: number | null
          mayer_part_number?: string | null
          mount_type?: string | null
          panel_type?: string | null
          part_number: string
          possible_equivalent?: string | null
          product_line?: string | null
          product_type?: string | null
          rack_compatibility?: string | null
          rack_units?: number | null
          search_vector?: unknown | null
          short_description?: string | null
          supports_splice_trays?: boolean | null
          upc_number?: string | null
          updated_at?: string | null
        }
        Update: {
          accepts_number_of_connector_housing_panels?: number | null
          brand?: string
          brand_normalized?: string | null
          category?: string | null
          color?: string | null
          common_terms?: string | null
          created_at?: string | null
          created_by?: string | null
          environment?: string | null
          fiber_enclosure_splice_tray?: string | null
          go_with_items?: string | null
          id?: number
          image_file?: string | null
          is_active?: boolean | null
          last_modified_by?: string | null
          material?: string | null
          max_fiber_capacity?: number | null
          mayer_part_number?: string | null
          mount_type?: string | null
          panel_type?: string | null
          part_number?: string
          possible_equivalent?: string | null
          product_line?: string | null
          product_type?: string | null
          rack_compatibility?: string | null
          rack_units?: number | null
          search_vector?: unknown | null
          short_description?: string | null
          supports_splice_trays?: boolean | null
          upc_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      search_variations: {
        Row: {
          category: string
          created_at: string | null
          id: number
          region: string | null
          standard_term: string
          variation: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: number
          region?: string | null
          standard_term: string
          variation: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: number
          region?: string | null
          standard_term?: string
          variation?: string
        }
        Relationships: []
      }
      selection_sessions: {
        Row: {
          created_at: string | null
          current_step: string | null
          id: string
          last_activity: string | null
          selections: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_step?: string | null
          id?: string
          last_activity?: string | null
          selections?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_step?: string | null
          id?: string
          last_activity?: string | null
          selections?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      jack_modules: {
        Row: {
          id: number
          part_number: string
          brand: string
          brand_normalized: string | null
          product_line: string | null
          short_description: string | null
          upc_number: string | null
          product_type: string | null
          category_rating: string | null
          pair_count: string | null
          color: string | null
          shielding_type: string | null
          installation_tools_required: string | null
          common_terms: string | null
          compatible_faceplates: string | null
          image_file: string | null
          possible_cross: string | null
          go_with_items: string | null
          created_at: string | null
          updated_at: string | null
          is_active: boolean | null
          search_vector: unknown | null
        }
        Insert: {
          id: number
          part_number: string
          brand: string
          brand_normalized?: string | null
          product_line?: string | null
          short_description?: string | null
          upc_number?: string | null
          product_type?: string | null
          category_rating?: string | null
          pair_count?: string | null
          color?: string | null
          shielding_type?: string | null
          installation_tools_required?: string | null
          common_terms?: string | null
          compatible_faceplates?: string | null
          image_file?: string | null
          possible_cross?: string | null
          go_with_items?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_active?: boolean | null
          search_vector?: unknown | null
        }
        Update: {
          id?: number
          part_number?: string
          brand?: string
          brand_normalized?: string | null
          product_line?: string | null
          short_description?: string | null
          upc_number?: string | null
          product_type?: string | null
          category_rating?: string | null
          pair_count?: string | null
          color?: string | null
          shielding_type?: string | null
          installation_tools_required?: string | null
          common_terms?: string | null
          compatible_faceplates?: string | null
          image_file?: string | null
          possible_cross?: string | null
          go_with_items?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_active?: boolean | null
          search_vector?: unknown | null
        }
        Relationships: []
      }
      faceplates: {
        Row: {
          id: number
          part_number: string
          brand: string
          brand_normalized: string | null
          product_line: string | null
          short_description: string | null
          upc_number: string | null
          product_type: string | null
          category_rating: string | null
          color: string | null
          number_of_ports: number | null
          number_gang: string | null
          type: string | null
          shielding_type: string | null
          installation_tools_required: string | null
          common_terms: string | null
          compatible_jacks: string | null
          image_file: string | null
          possible_cross: string | null
          go_with_items: string | null
          created_at: string | null
          updated_at: string | null
          is_active: boolean | null
          search_vector: unknown | null
        }
        Insert: {
          id: number
          part_number: string
          brand: string
          brand_normalized?: string | null
          product_line?: string | null
          short_description?: string | null
          upc_number?: string | null
          product_type?: string | null
          category_rating?: string | null
          color?: string | null
          number_of_ports?: number | null
          number_gang?: string | null
          type?: string | null
          shielding_type?: string | null
          installation_tools_required?: string | null
          common_terms?: string | null
          compatible_jacks?: string | null
          image_file?: string | null
          possible_cross?: string | null
          go_with_items?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_active?: boolean | null
          search_vector?: unknown | null
        }
        Update: {
          id?: number
          part_number?: string
          brand?: string
          brand_normalized?: string | null
          product_line?: string | null
          short_description?: string | null
          upc_number?: string | null
          product_type?: string | null
          category_rating?: string | null
          color?: string | null
          number_of_ports?: number | null
          number_gang?: string | null
          type?: string | null
          shielding_type?: string | null
          installation_tools_required?: string | null
          common_terms?: string | null
          compatible_jacks?: string | null
          image_file?: string | null
          possible_cross?: string | null
          go_with_items?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_active?: boolean | null
          search_vector?: unknown | null
        }
        Relationships: []
      }
      wall_mount_fiber_enclosures: {
        Row: {
          accepts_number_of_connector_housing_panels: number | null
          brand: string | null
          category: string | null
          color: string | null
          common_terms: string | null
          created_at: string | null
          created_by: string | null
          environment: string | null
          fiber_enclosure_splice_tray: string | null
          go_with_items: string | null
          id: number
          image_file: string | null
          is_active: boolean | null
          last_modified_by: string | null
          material: string | null
          max_fiber_capacity: number | null
          mayer_part_number: string | null
          mount_type: string | null
          panel_type: string | null
          part_number: string | null
          possible_equivalent: string | null
          product_line: string | null
          product_type: string | null
          rack_compatibility: string | null
          search_vector: unknown | null
          short_description: string | null
          supports_splice_trays: boolean | null
          upc_number: string | null
          updated_at: string | null
        }
        Insert: {
          accepts_number_of_connector_housing_panels?: number | null
          brand?: string | null
          category?: string | null
          color?: string | null
          common_terms?: string | null
          created_at?: string | null
          created_by?: string | null
          environment?: string | null
          fiber_enclosure_splice_tray?: string | null
          go_with_items?: string | null
          id: number
          image_file?: string | null
          is_active?: boolean | null
          last_modified_by?: string | null
          material?: string | null
          max_fiber_capacity?: number | null
          mayer_part_number?: string | null
          mount_type?: string | null
          panel_type?: string | null
          part_number?: string | null
          possible_equivalent?: string | null
          product_line?: string | null
          product_type?: string | null
          rack_compatibility?: string | null
          search_vector?: unknown | null
          short_description?: string | null
          supports_splice_trays?: boolean | null
          upc_number?: string | null
          updated_at?: string | null
        }
        Update: {
          accepts_number_of_connector_housing_panels?: number | null
          brand?: string | null
          category?: string | null
          color?: string | null
          common_terms?: string | null
          created_at?: string | null
          created_by?: string | null
          environment?: string | null
          fiber_enclosure_splice_tray?: string | null
          go_with_items?: string | null
          id?: number
          image_file?: string | null
          is_active?: boolean | null
          last_modified_by?: string | null
          material?: string | null
          max_fiber_capacity?: number | null
          mayer_part_number?: string | null
          mount_type?: string | null
          panel_type?: string | null
          part_number?: string | null
          possible_equivalent?: string | null
          product_line?: string | null
          product_type?: string | null
          rack_compatibility?: string | null
          search_vector?: unknown | null
          short_description?: string | null
          supports_splice_trays?: boolean | null
          upc_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      product_search: {
        Row: {
          brand: string | null
          category: string | null
          id: number | null
          part_number: string | null
          product_table: string | null
          search_text: string | null
          short_description: string | null
        }
        Relationships: []
      }
      products_without_cutsheets: {
        Row: {
          brand: string | null
          issue: string | null
          part_number: string | null
          product_id: string | null
          product_table: string | null
          short_description: string | null
        }
        Relationships: []
      }
      v_products_complete: {
        Row: {
          category_name: string | null
          detailed_description: string | null
          distributor_name: string | null
          fiber_connector_type: string | null
          fiber_technology: string | null
          id: string | null
          manufacturer_name: string | null
          max_fiber_capacity: number | null
          number_of_adapter_per_panel: number | null
          part_number: string | null
          rack_units: number | null
          requires_splice_tray: boolean | null
          short_description: string | null
          stock_quantity: number | null
          unit_price: number | null
        }
        Relationships: []
      }
      weekly_missing_cutsheets: {
        Row: {
          additional_info: string | null
          brand: string | null
          part_number: string | null
          product_table: string | null
          short_description: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_jacket_variations: {
        Args: { jacket_text: string }
        Returns: string
      }
      add_spelling_variations: {
        Args: { text_input: string }
        Returns: string
      }
      aggressive_clean_text: {
        Args: { input_text: string }
        Returns: string
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      clean_text_field: {
        Args: { input_text: string }
        Returns: string
      }
      fast_search_all: {
        Args: { search_term: string }
        Returns: {
          table_name: string
          part_number: string
          brand: string
          description: string
        }[]
      }
      get_compatible_enclosures: {
        Args: { adapter_ids: number[]; adapter_quantities: number[] }
        Returns: {
          enclosure_id: number
          part_number: string
          panel_type: string
          max_fiber_capacity: number
          accepts_number_of_connector_housing_panels: number
          panel_capacity_used: string
          fiber_capacity_used: string
          compatibility_notes: string
        }[]
      }
      get_product_datasheets: {
        Args: { p_product_table: string; p_product_id: string }
        Returns: {
          datasheet_id: string
          document_title: string
          file_url: string
          file_type: string
          manufacturer: string
          link_type: string
          download_count: number
        }[]
      }
      get_products_needing_cutsheets: {
        Args: {
          product_type_filter?: string
          brand_filter?: string
          limit_results?: number
        }
        Returns: {
          product_table: string
          part_number: string
          brand: string
          short_description: string
          additional_info: string
        }[]
      }
      get_searchable_tables_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          has_part_number: boolean
          has_is_active: boolean
          row_count: number
          sample_part_number: string
        }[]
      }
      get_table_columns: {
        Args: { table_name: string }
        Returns: {
          column_name: string
        }[]
      }
      get_tables_with_column: {
        Args: { column_name: string }
        Returns: {
          table_name: string
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      migrate_go_with_items: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_inventory: {
        Args: {
          search_term: string
          distributor_id_filter?: number
          max_results?: number
        }
        Returns: {
          part_number: string
          manufacturer_part_number: string
          description: string
          manufacturer_name: string
          category: string
          quantity: number
          price: number
          distributor_name: string
          location_name: string
          city: string
          state: string
        }[]
      }
      simple_migrate_relationships: {
        Args: { source_table: string; source_id: number; go_with_text: string }
        Returns: number
      }
      simple_search_products: {
        Args: { search_term: string }
        Returns: {
          table_source: string
          part_number: string
          brand: string
          description: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      super_clean_text: {
        Args: { input_text: string }
        Returns: string
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      weekly_cutsheet_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          product_table: string
          total_products: number
          products_with_cutsheets: number
          products_missing_cutsheets: number
          percentage_with_cutsheets: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
