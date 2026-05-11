import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '.env') });

const SUPABASE_URL         = (process.env.SUPABASE_URL         || '').trim();
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('⚠️  Supabase env vars missing — set SUPABASE_URL and SUPABASE_SERVICE_KEY in server/.env');
}

// Validate URL before passing to createClient
let supabaseUrl = SUPABASE_URL;
try {
  new URL(supabaseUrl);
} catch {
  console.warn('⚠️  SUPABASE_URL is not a valid URL:', JSON.stringify(supabaseUrl));
  supabaseUrl = 'https://placeholder.supabase.co';
}

export const supabase = createClient(supabaseUrl, SUPABASE_SERVICE_KEY || 'placeholder', {
  auth: { persistSession: false },
});
