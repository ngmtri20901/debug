// API exports for the learn feature
// Only export client-safe APIs here (lesson-progress.ts uses client-side Supabase)
export * from './lesson-progress'

// Server-only APIs (practice.ts) should be imported directly from their files
// Do not export practice.ts here to avoid bundling server code in client components