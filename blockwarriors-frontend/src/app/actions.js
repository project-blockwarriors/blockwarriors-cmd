import { createServerSupabaseClient } from "@supabase/server-client";

export const createServerClient = () => {
  const supabaseServerClient = createServerSupabaseClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  return supabaseServerClient;
};
