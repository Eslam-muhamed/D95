import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function runGatewayTest() {
  console.log('--- Starting Gateway Anti-Hoarding Bypass Test ---')
  
  // Start date in future to avoid business impact
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + 30) // 30 days from now
  const bookingDate = startDate.toISOString().split('T')[0]
  
  for (let i = 1; i <= 6; i++) {
    const reservationId = `TEST-GATEWAY-${Date.now()}-${i}`
    const p_booking = {
      reservation_id: reservationId,
      customer_name: `Gateway Test User ${i}`,
      customer_phone: `010${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`, // random phone
      room_id: 'room-1',
      room_name: 'Room 1',
      booking_date: bookingDate,
      start_datetime: new Date(startDate.getTime() + (i * 3600000)).toISOString(),
      end_datetime: new Date(startDate.getTime() + ((i + 1) * 3600000)).toISOString(),
      duration_hours: 1,
      payment_method: 'instapay',
      status: 'pending'
    }

    console.log(`\nAttempt ${i}: Using phone ${p_booking.customer_phone}`)
    
    // We are testing the edge function gateway directly
    const { data, error } = await supabase.functions.invoke('create-booking', {
      body: { p_booking, turnstile_token: null }
    })

    if (error) {
      if (error.message?.includes('challenge_required') || error.context?.status === 403) {
        console.log(`❌ Attempt ${i} BLOCKED BY GATEWAY: CHALLENGE REQUIRED (Progressive security triggered!)`)
      } else if (error.context?.status === 429) {
        console.log(`❌ Attempt ${i} HARD BLOCKED BY GATEWAY: TOO MANY REQUESTS (Abuse limit reached!)`)
      } else {
        console.log(`❌ Attempt ${i} FAILED:`, error.message)
      }
    } else {
      console.log(`✅ Attempt ${i} SUCCEEDED via Gateway`)
    }
    
    // Slight delay to avoid network-level rate limits
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

runGatewayTest()
