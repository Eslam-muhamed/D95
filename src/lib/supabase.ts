import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://eprpagnkxxkuykbzhvge.supabase.co';
const FALLBACK_KEY = 'sb_publishable_mSDH8vHZfdbb3lGVrM71bg_bmUQ9eJi';

const envUrl = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL);

const envKey = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY);

if (!envUrl || !envKey) {
    console.warn('⚠️ CRITICAL WARNING: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Using hardcoded fallback credentials. Please configure environment variables in Vercel/Production.');
}

export const supabase = createClient(envUrl || FALLBACK_URL, envKey || FALLBACK_KEY);

