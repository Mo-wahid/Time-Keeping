import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient<any>> | undefined;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  if (!client) {
    client = createBrowserClient<any>(supabaseUrl, supabaseKey);
  }
  return client;
}
