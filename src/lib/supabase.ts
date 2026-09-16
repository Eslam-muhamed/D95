import { createClient } from '@supabase/supabase-js';

const envUrl = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL);

const envKey = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY);

if (!envUrl || !envKey) {
    throw new Error('CRITICAL ERROR: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables. The application cannot start securely.');
}

export const supabase = createClient(envUrl, envKey);
