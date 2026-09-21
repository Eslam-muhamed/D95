import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://eprpagnkxxkuykbzhvge.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mSDH8vHZfdbb3lGVrM71bg_bmUQ9eJi';

// Create three separate clients to ensure no session overlap
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const customerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

async function runTests() {
    console.log('\n--- FINAL AUTHORIZATION RETEST ---');
    
    const adminEmail = 'admin_test_1789930393475@d95.com';
    const custEmail = 'cust_test_1789930393475@d95.com';
    const password = 'TestPassword123!';
    
    // Sign in Customer
    const { error: custErr } = await customerClient.auth.signInWithPassword({ email: custEmail, password });
    if (custErr) throw new Error('Customer login failed: ' + custErr.message);
    
    // Sign in Admin
    const { error: adminErr } = await adminClient.auth.signInWithPassword({ email: adminEmail, password });
    if (adminErr) throw new Error('Admin login failed: ' + adminErr.message);

    // Get the target customer ID to test adjustment
    const { data: targetCust } = await adminClient.from('customers').select('id').eq('phone_number', '01000000001').single();
    if (!targetCust) throw new Error('Could not find target customer ID');
    const targetCustId = targetCust.id;

    // --- 1. Anonymous Tests ---
    console.log('\n[1] Anonymous Tests');
    const { error: anon1 } = await anonClient.rpc('admin_adjust_points', { p_customer_id: targetCustId, p_points: 10, p_reason: 'Anon hack' });
    console.log('Anonymous admin_adjust_points:', anon1 ? `FAIL (Safe: ${anon1.message})` : 'SUCCESS (Vulnerable!)');
    
    const { error: anon2 } = await anonClient.rpc('get_customer_loyalty_info', { p_phone: '01000000001' });
    console.log('Anonymous get_customer_loyalty_info:', anon2 ? `FAIL (Safe: ${anon2.message})` : 'SUCCESS (Vulnerable!)');


    // --- 2. Normal Customer Tests ---
    console.log('\n[2] Normal Customer Tests');
    const { error: cust1 } = await customerClient.rpc('admin_adjust_points', { p_customer_id: targetCustId, p_points: 10, p_reason: 'Cust hack' });
    console.log('Customer admin_adjust_points:', cust1 ? `FAIL (Safe: ${cust1.message})` : 'SUCCESS (Vulnerable!)');
    
    const { error: cust2 } = await customerClient.rpc('get_customer_loyalty_info', { p_phone: '01000000001' });
    console.log('Customer get_customer_loyalty_info:', cust2 ? `FAIL (Safe: ${cust2.message})` : 'SUCCESS (Vulnerable!)');


    // --- 3. Authorized Admin Tests ---
    console.log('\n[3] Authorized Admin Tests');
    const { error: admin1 } = await adminClient.rpc('admin_adjust_points', { p_customer_id: targetCustId, p_points: 10, p_reason: 'Admin test' });
    console.log('Admin admin_adjust_points:', admin1 ? `FAIL (Error: ${admin1.message})` : 'SUCCESS (Expected)');
    
    const { data: adminData2, error: admin2 } = await adminClient.rpc('get_customer_loyalty_info', { p_phone: '01000000001' });
    console.log('Admin get_customer_loyalty_info:', admin2 ? `FAIL (Error: ${admin2.message})` : 'SUCCESS (Expected)');
    
    // Cleanup: Revert points
    console.log('\nCleaning up points...');
    await adminClient.rpc('admin_adjust_points', { p_customer_id: targetCustId, p_points: -10, p_reason: 'Cleanup admin test' });
}

runTests().catch(console.error);
