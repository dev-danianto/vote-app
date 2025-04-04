// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "YOUR URL KEY";
const supabaseKey = "YOUR API KEY";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase URL or Anon Key is missing. Check your environment variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
