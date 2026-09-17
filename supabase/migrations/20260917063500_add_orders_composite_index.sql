-- Composite index on orders for status filtering + created_at sorting
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders (status, created_at DESC);
