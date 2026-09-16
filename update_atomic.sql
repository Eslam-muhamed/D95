CREATE OR REPLACE FUNCTION "public"."create_order_atomic"("p_order" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_order_number TEXT;
  v_customer_name TEXT;
  v_customer_phone TEXT;
  v_order_type TEXT;
  v_table_number TEXT;
  v_delivery_address TEXT;
  v_payment_method TEXT;
  v_items JSONB;
  v_notes TEXT;
  v_user_id UUID;
  v_sanitized_items JSONB := '[]'::jsonb;
  v_item RECORD;
  v_product RECORD;
  v_unit_price NUMERIC;
  v_qty INT;
  v_customization JSONB;
  v_extra_price NUMERIC;
  v_subtotal NUMERIC := 0.00;
  v_total NUMERIC := 0.00;
  v_new_order public.orders;
BEGIN
  v_order_number := UPPER(TRIM(COALESCE(p_order->>'order_number', 'D95-ORD-' || floor(random() * 90000 + 10000)::text)));
  v_customer_name := TRIM(COALESCE(p_order->>'customer_name', 'عميل'));
  v_customer_phone := NULLIF(REGEXP_REPLACE(COALESCE(p_order->>'customer_phone', ''), '[^0-9]', '', 'g'), '');
  v_order_type := COALESCE(p_order->>'order_type', 'dine');
  v_table_number := NULLIF(TRIM(COALESCE(p_order->>'table_number', '')), '');
  v_delivery_address := NULLIF(TRIM(COALESCE(p_order->>'delivery_address', '')), '');
  v_payment_method := COALESCE(p_order->>'payment_method', 'wallet');
  v_items := COALESCE(p_order->'items', '[]'::jsonb);
  v_notes := NULLIF(TRIM(COALESCE(p_order->>'notes', '')), '');
  
  -- Extract user_id if present
  IF p_order->>'user_id' IS NOT NULL AND p_order->>'user_id' != '' THEN
      v_user_id := (p_order->>'user_id')::UUID;
  END IF;

  IF jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'لا يمكن إنشاء طلب فارغ' USING ERRCODE = '22023';
  END IF;

  -- Verify unique order_number collision
  IF EXISTS (SELECT 1 FROM public.orders WHERE order_number = v_order_number) THEN
    v_order_number := v_order_number || '-' || floor(random() * 900 + 100)::text;
  END IF;

  -- Authoritative Price Calculation from products table
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) AS elem
  LOOP
    v_qty := GREATEST(1, COALESCE((v_item.value->>'quantity')::INT, 1));
    v_customization := COALESCE(v_item.value->'customization', '{}'::jsonb);
    v_extra_price := 0.00;

    -- Extra shot adds 15 EGP
    IF (v_customization->>'extraShot')::BOOLEAN IS TRUE THEN
      v_extra_price := v_extra_price + 15.00;
    END IF;

    -- Lookup product in products table
    v_unit_price := NULL;
    IF (v_item.value->>'id') IS NOT NULL THEN
      SELECT price INTO v_product FROM public.products
      WHERE id::text = (v_item.value->>'id') OR slug = (v_item.value->>'id')
      LIMIT 1;

      IF FOUND THEN
        v_unit_price := v_product.price;
      END IF;
    END IF;

    -- Reject invalid products strictly
    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'منتج غير صالح' USING ERRCODE = '22023';
    END IF;

    v_unit_price := v_unit_price + v_extra_price;
    v_subtotal := v_subtotal + (v_unit_price * v_qty);

    v_sanitized_items := v_sanitized_items || jsonb_build_object(
      'id', COALESCE(v_item.value->>'id', 'custom'),
      'name', COALESCE(v_item.value->>'name', 'صنف'),
      'price', v_unit_price,
      'quantity', v_qty,
      'customization', v_customization
    );
  END LOOP;

  v_total := ROUND(v_subtotal, 2);

  INSERT INTO public.orders (
    order_number,
    customer_name,
    customer_phone,
    order_type,
    table_number,
    delivery_address,
    payment_method,
    items,
    subtotal,
    total_amount,
    status,
    notes,
    user_id
  ) VALUES (
    v_order_number,
    v_customer_name,
    v_customer_phone,
    v_order_type,
    v_table_number,
    v_delivery_address,
    v_payment_method,
    v_sanitized_items,
    v_total,
    v_total,
    'pending',
    v_notes,
    v_user_id
  )
  RETURNING * INTO v_new_order;

  RETURN row_to_json(v_new_order)::jsonb;
END;
$$;
