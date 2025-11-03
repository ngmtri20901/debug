import { createBrowserClient } from "@supabase/ssr"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Create a dummy client for when Supabase is not configured
const createDummyClient = () => ({
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
    signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
    signInWithOAuth: () => Promise.resolve({ data: { provider: "", url: "" }, error: { message: "Supabase not configured" } }),
    resetPasswordForEmail: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
    exchangeCodeForSession: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
  },
  rpc: (fnName: string, params?: any) => Promise.resolve({ 
    data: null, 
    error: { message: "Supabase not configured" } 
  }),
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        eq: (column2: string, value2: any) => ({
          eq: (column3: string, value3: any) => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      order: (column: string, options?: { ascending?: boolean }) => ({
        order: (column2: string, options2?: { ascending?: boolean }) => Promise.resolve({ data: null, error: null }),
      }),
      single: () => Promise.resolve({ data: null, error: null }),
    }),
    insert: (values: any) => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null, count: 0 }),
    }),
    delete: () => Promise.resolve({ data: null, error: null }),
  }),
  storage: {
    from: (bucket: string) => ({
      getPublicUrl: (path: string) => ({
        data: { publicUrl: null }
      }),
      upload: (path: string, file: File, options?: any) => 
        Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      remove: (paths: string[]) => 
        Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      list: (path?: string, options?: any) => 
        Promise.resolve({ data: null, error: { message: "Supabase not configured" } })
    })
  }
})

// Create a function to create the Supabase client for Client Components
export function createClient() {
  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set. Using dummy client.")
    return createDummyClient()
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        // DISABLED: Prevent auto refresh to avoid disrupting review sessions
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Add session refresh handling for better control
        flowType: 'pkce'
      },
      // Add global configuration for better stability
      global: {
        headers: {
          'X-Client-Info': 'vietnamese-learning-app'
        }
      }
    }
  )
}

// Export a singleton instance for backward compatibility
export const supabase = createClient()