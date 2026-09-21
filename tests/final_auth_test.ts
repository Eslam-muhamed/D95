import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://eprpagnkxxkuykbzhvge.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mSDH8vHZfdbb3lGVrM71bg_bmUQ9eJi';

// Create three separate clients to ensure no session overlap
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const customerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

async function runTests() {
    console.log('--- FINAL AUTHORIZATION RETEST ---');
    
    // We assume the user has run the setup SQL to create these accounts and set passwords.
    // In our case, we will use existing accounts we know about, OR we can just use SignUp and ask SQL to confirm them.
    // Let's just create new ones using signUp.
    
    const adminEmail = `admin_test_${Date.now()}@d95.com`;
    const custEmail = `cust_test_${Date.now()}@d95.com`;
    const password = 'TestPassword123!';
    
    console.log(`Setting up test accounts...`);
    
    // 1. Sign up Customer
    await customerClient.auth.signUp({ email: custEmail, password });
    // 2. Sign up Admin
    await adminClient.auth.signUp({ email: adminEmail, password });
    
    // Pause to let the test runner (me) execute the SQL to confirm emails and set roles
    console.log(`\nATTENTION: Please run the SQL to confirm emails and add admin_test to staff_users.`);
    console.log(`UPDATE auth.users SET email_confirmed_at = NOW() WHERE email IN ('${custEmail}', '${adminEmail}');`);
    console.log(`INSERT INTO public.staff_users (email, role) VALUES ('${adminEmail}', 'admin');`);
    console.log(`INSERT INTO public.customers (auth_user_id, phone_number, full_name, loyalty_points_balance) VALUES ((SELECT id FROM auth.users WHERE email = '${custEmail}'), '01000000001', 'Test Cust', 0);`);
    console.log(`\nWaiting for SQL execution...`);
}

runTests().catch(console.error);
