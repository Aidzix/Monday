import { createClient } from '@supabase/supabase-js';

if (!process.env.REACT_APP_SUPABASE_URL) {
  throw new Error('https://azjtpxorqduxgolvmekp.supabase.co');
}

if (!process.env.REACT_APP_SUPABASE_ANON_KEY) {
  throw new Error('your-anon-key');
}

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
); 