-- Test 1 & 2: Booking status constraints
DO $$
BEGIN
    -- Valid status should be accepted
    INSERT INTO public.ps_bookings (reservation_id, customer_name, customer_phone, room_name, room_id, booking_date, start_datetime, end_datetime, start_time, end_time, payment_method, status)
    VALUES ('TEST-VALID-1', 'Test', '01011111111', 'Room 1', 'room-1', '2026-10-10', NOW(), NOW() + interval '1 hour', '12', '1', 'cash', 'confirmed');
    
    -- Invalid status should fail
    BEGIN
        INSERT INTO public.ps_bookings (reservation_id, customer_name, customer_phone, room_name, room_id, booking_date, start_datetime, end_datetime, start_time, end_time, payment_method, status)
        VALUES ('TEST-INV-1', 'Test', '01011111111', 'Room 1', 'room-1', '2026-10-10', NOW(), NOW() + interval '1 hour', '12', '1', 'cash', 'banana');
        RAISE EXCEPTION 'TEST FAILED: Invalid booking status was accepted!';
    EXCEPTION WHEN check_violation THEN
        -- Expected
    END;

    -- Valid update
    UPDATE public.ps_bookings SET status = 'completed' WHERE reservation_id = 'TEST-VALID-1';

    -- Invalid update
    BEGIN
        UPDATE public.ps_bookings SET status = 'active' WHERE reservation_id = 'TEST-VALID-1';
        RAISE EXCEPTION 'TEST FAILED: Invalid booking status update was accepted!';
    EXCEPTION WHEN check_violation THEN
        -- Expected
    END;
    
    -- Cleanup
    DELETE FROM public.ps_bookings WHERE reservation_id = 'TEST-VALID-1';
END $$;

-- Test 4, 5, 7: Tournament and Orders constraints
DO $$
BEGIN
    -- Tournaments
    INSERT INTO public.tournaments (name, game, status) VALUES ('Test Tourney', 'FIFA', 'upcoming');
    
    BEGIN
        INSERT INTO public.tournaments (name, game, status) VALUES ('Test Tourney 2', 'FIFA', 'invalid');
        RAISE EXCEPTION 'TEST FAILED: Invalid tournament status accepted!';
    EXCEPTION WHEN check_violation THEN
        -- Expected
    END;
    
    UPDATE public.tournaments SET status = 'active' WHERE name = 'Test Tourney';
    
    BEGIN
        UPDATE public.tournaments SET status = 'finished' WHERE name = 'Test Tourney';
        RAISE EXCEPTION 'TEST FAILED: Invalid tournament status update accepted!';
    EXCEPTION WHEN check_violation THEN
        -- Expected
    END;
    
    DELETE FROM public.tournaments WHERE name = 'Test Tourney';

    -- Orders
    INSERT INTO public.orders (order_number, customer_name, customer_phone, order_type, payment_method, status)
    VALUES ('ORD-TEST-1', 'Test', '0101', 'dine', 'cash', 'preparing');
    
    BEGIN
        UPDATE public.orders SET status = 'banana' WHERE order_number = 'ORD-TEST-1';
        RAISE EXCEPTION 'TEST FAILED: Invalid order status update accepted!';
    EXCEPTION WHEN check_violation THEN
        -- Expected
    END;

    DELETE FROM public.orders WHERE order_number = 'ORD-TEST-1';
END $$;
