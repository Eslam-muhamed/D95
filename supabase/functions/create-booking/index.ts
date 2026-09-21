import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    // Create a service role client to securely query IP quotas and execute guest bookings
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
    
    const { p_booking, turnstile_token } = await req.json()
    
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

    // 2. IP Rate Limiting & Quotas
    // Count active pending bookings
    const { count: pendingCount } = await serviceClient
      .from('ps_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('client_ip', clientIp)
      .eq('status', 'pending')

    // Count hourly velocity
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: hourlyCount } = await serviceClient
      .from('ps_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('client_ip', clientIp)
      .gte('created_at', oneHourAgo)

    const activePending = pendingCount || 0
    const activeHourly = hourlyCount || 0

    // Abusive Tier (Hard Block)
    if (activePending >= 15 || activeHourly >= 40) {
      return new Response(JSON.stringify({ error: 'Too many requests from this IP.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 })
    }

    // Suspicious Tier (Challenge Required)
    if (activePending >= 5 || activeHourly >= 10) {
      if (!turnstile_token) {
        return new Response(JSON.stringify({ error: 'challenge_required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
      }

      // Verify Turnstile (Fail-Closed)
      const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
      if (!turnstileSecret) {
        return new Response(JSON.stringify({ error: 'Security configuration missing. Please try again later.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 })
      }

      const formData = new FormData();
      formData.append('secret', turnstileSecret);
      formData.append('response', turnstile_token);
      formData.append('remoteip', clientIp);

      const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData
      });

      const verifyOutcome = await verifyResponse.json();
      if (!verifyOutcome.success) {
        return new Response(JSON.stringify({ error: 'Invalid captcha token' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
      }
    }

    // 3. Inject Client IP into payload
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
