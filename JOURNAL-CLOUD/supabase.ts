import { createClient } from '@supabase/supabase-js'

// These two values are public by design: the anon key only grants access that
// the database's row-level security policies allow. Environment variables win
// so the project can be pointed somewhere else without editing code.
const URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://qjfrnpollrgboczoyutc.supabase.co'
const ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZnJucG9sbHJnYm9jem95dXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzI0ODUsImV4cCI6MjEwNTE0ODQ4NX0.XbgjLldQWJU8qCbJwJ9VLuCdJzG-iFm4NW17R4jTsXw'

export const supabase = createClient(URL, ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const SHOTS_BUCKET = 'shots'
