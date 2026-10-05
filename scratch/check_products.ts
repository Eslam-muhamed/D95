import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
    const { data: prods, error } = await supabase.from('products').select('name, category_id').limit(5);
    console.log("Products:", prods);
}
run();
