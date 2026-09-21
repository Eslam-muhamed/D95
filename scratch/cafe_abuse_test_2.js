import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eprpagnkxxkuykbzhvge.supabase.co';
const supabaseKey = 'sb_publishable_mSDH8vHZfdbb3lGVrM71bg_bmUQ9eJi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCafeAbuse() {
    console.log('--- Testing Cafe Order Abuse ---');
    
    // Fetch a real product
    const { data: products, error: pErr } = await supabase.from('products').select('id, price').limit(1);
    if (pErr || !products || products.length === 0) {
        console.log(`Failed to fetch products: ${pErr ? pErr.message : 'Empty'}`);
        return;
    }
    const realProduct = products[0];
    console.log(`Using real product: ${realProduct.id} (Price: ${realProduct.price})`);

    // Test 1: Negative Quantity
    const payload1 = {
        customer_name: `Abuser`,
        customer_phone: '01011111111',
        items: [{ id: realProduct.id, quantity: -5, price: 100 }],
        total_amount: -500
    };
    
    const { data: data1, error: err1 } = await supabase.rpc('create_order_atomic', { p_order: payload1 });
    console.log(`[Negative Qty] Data: ${JSON.stringify(data1)}, Error: ${err1 ? err1.message : 'none'}`);

    // Test 2: Fake Price
    const payload2 = {
        customer_name: `Abuser`,
        customer_phone: '01011111111',
        items: [{ id: realProduct.id, quantity: 1, price: 1 }], // Actual price is much higher
        total_amount: 1
    };

    const { data: data2, error: err2 } = await supabase.rpc('create_order_atomic', { p_order: payload2 });
    console.log(`[Fake Price] Data: ${JSON.stringify(data2)}, Error: ${err2 ? err2.message : 'none'}`);
}

testCafeAbuse();
