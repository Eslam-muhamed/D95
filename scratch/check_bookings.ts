import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('ps_bookings')
    .select('id, customer_name, room_id, status, booking_date, start_time, end_time, start_datetime, end_datetime')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error(error);
  } else {
    console.table(data);
  }
}
main();
