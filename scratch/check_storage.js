import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eprpagnkxxkuykbzhvge.supabase.co';
const supabaseKey = 'sb_publishable_mSDH8vHZfdbb3lGVrM71bg_bmUQ9eJi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
    console.log('--- Checking Storage Buckets ---');
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.log(`Failed to list buckets: ${error.message}`);
    } else {
        console.log(`Found ${data.length} buckets.`);
        for (const bucket of data) {
            console.log(`- Bucket: ${bucket.name}, Public: ${bucket.public}`);
        }
    }
}
checkStorage();
