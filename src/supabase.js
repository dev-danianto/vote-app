// src/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("VITE_SUPABASE_URL is not defined in .env");
}

if (!supabaseAnonKey) {
  console.error("VITE_SUPABASE_ANON_KEY is not defined in .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
