import { createClient } from "@supabase/supabase-js";

// Fallback is added so the app doesn't crash immediately if Vercel misses the env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://missing-url.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "missing-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
