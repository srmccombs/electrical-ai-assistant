// lib/supabase.ts
// Supabase client with full TypeScript support
// Created: June 6, 2025

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/supabase'

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnmugslmheoxbsubhzci.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubXVnc2xtaGVveGJzdWJoemNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjQzNDMsImV4cCI6MjA2MzM0MDM0M30.7ccrbEVka0K8HsRzwUSkpH0j30m1z8aEhDRXrtx_mPo'

// Create typed Supabase client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

// Export useful type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Export the Database type for use in other files
export type { Database }