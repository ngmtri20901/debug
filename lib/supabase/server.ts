import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
    resetPasswordForEmail: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
    exchangeCodeForSession: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
    getClaims: () => Promise.resolve({ data: { claims: null }, error: { message: "Supabase not configured" } }),
  },
  rpc: (fnName: string, params?: unknown) => Promise.resolve({
    data: null,
    error: { message: "Supabase not configured" }
  }),
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: unknown) => ({
        eq: (column2: string, value2: unknown) => ({
          eq: (column3: string, value3: unknown) => ({
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
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null, count: 0 }),
    }),
    delete: () => Promise.resolve({ data: null, error: null }),
  }),
  storage: {
    from: (bucket: string) => ({
      getPublicUrl: (path: string) => ({
        data: { publicUrl: null }
      })
    })
  }
})

// Create Supabase client for Server Components
export async function createClient() {
  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set. Using dummy client.")
    return createDummyClient()
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      // Add configuration to prevent session refresh during review sessions
      auth: {
        persistSession: true,
        autoRefreshToken: false, // Disable auto refresh in server components
        detectSessionInUrl: true,
      }
    }
  )
}