import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dnmugslmheoxbsubhzci.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubXVnc2xtaGVveGJzdWJoemNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjQzNDMsImV4cCI6MjA2MzM0MDM0M30.7ccrbEVka0K8HsRzwUSkpH0j30m1z8aEhDRXrtx_mPo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)