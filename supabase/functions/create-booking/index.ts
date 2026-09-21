// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// @ts-ignore
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    // Create a service role client to securely query IP quotas and execute guest bookings
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
    
    const { p_booking } = await req.json()
    
    if (!p_booking || !p_booking.reservation_id) {
      return new Response(JSON.stringify({ error: 'Missing booking payload or reservation_id' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    // 1. Idempotency Check
    const { data: existingBooking } = await serviceClient
      .from('ps_bookings')
      .select('id, reservation_id, status, room_id, start_datetime, end_datetime, duration_hours')
      .eq('reservation_id', p_booking.reservation_id)
      .single()

    if (existingBooking) {
      // Validate material differences to avoid silently accepting changed payload
      const dbStart = new Date(existingBooking.start_datetime).getTime();
      const pStart = new Date(p_booking.start_datetime).getTime();
      const dbEnd = new Date(existingBooking.end_datetime).getTime();
      const pEnd = new Date(p_booking.end_datetime).getTime();

      if (
        existingBooking.room_id !== p_booking.room_id ||
        dbStart !== pStart ||
        dbEnd !== pEnd ||
        Number(existingBooking.duration_hours) !== Number(p_booking.duration_hours)
      ) {
        return new Response(JSON.stringify({ error: 'Conflict: reservation_id exists with materially different payload.', code: '409' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 })
      }

      // Safely return limited idempotency metadata (No PII)
      return new Response(JSON.stringify({
        success: true,
        id: existingBooking.id,
        reservation_id: existingBooking.reservation_id,
        status: existingBooking.status
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // 2. Inject Client IP into payload (Rate limiting removed by user request)
    p_booking.client_ip = clientIp;

    // 4. Execution Routing
    const authHeader = req.headers.get('Authorization')
    let executingClient = serviceClient

    if (authHeader && authHeader !== `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`) {
      // It's a non-default anon key token (likely an authenticated user JWT)
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await serviceClient.auth.getUser(token)
      
      if (user) {
        // Scoped client for authenticated users so auth.uid() resolves correctly in the DB
        executingClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
          global: { headers: { Authorization: authHeader } }
        })
      }
    }

    const { data: newBooking, error } = await executingClient.rpc('create_booking_atomic', { p_booking })

    if (error) {
      return new Response(JSON.stringify({ error: error.message, code: error.code }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    return new Response(JSON.stringify(newBooking), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
