export interface DBCategory {
    id: string;
    name: string;
    icon: string;
    description: string | null;
    display_order: number;
    created_at?: string;
}

export interface DBProduct {
    id: string;
    slug?: string;
    category_id: string | null;
    name: string;
    description: string;
    price: number;
    original_price: number | null;
    currency: string;
    image_url: string | null;
    badge: 'Popular' | 'New' | "Chef's Choice" | string | null;
    is_available: boolean;
    is_hot: boolean;
    is_cold: boolean;
    tags: string[];
    display_order: number;
    created_at?: string;
}

export interface DBOffer {
    id: string;
    title: string;
    description: string | null;
    detail: string | null;
    badge: string | null;
    price: string;
    original_price: string | null;
    icon: string;
    highlight: boolean;
    is_active: boolean;
    display_order: number;
    created_at?: string;
}

export interface DBBooking {
    id: string;
    reservation_id: string;
    customer_name: string;
    customer_phone: string;
    room_id?: string;
    room_name: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    start_datetime?: string;
    end_datetime?: string;
    duration_hours: number;
    subtotal: number;
    snacks_total: number;
    discount_amount: number;
    total_amount: number;
    payment_method: 'instapay' | 'cash' | 'wallet' | string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    snacks: Array<{
        id: string;
        name: string;
        price: number;
        iconType?: string;
        quantity?: number;
    }>;
    notes: string | null;
    created_at: string;
}

export interface BookingPolicy {
    mode: 'admin_approval_only' | 'temporary_hold';
    hold_minutes: number;
}

export interface DBOrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    customization?: Record<string, unknown>;
}

export interface DBOrder {
    id: string;
    order_number: string;
    customer_name: string | null;
    customer_phone: string | null;
    order_type: 'dine' | 'takeaway' | 'delivery' | string;
    table_number: string | null;
    delivery_address: string | null;
    payment_method: string | null;
    items: DBOrderItem[];
    subtotal: number;
    total_amount: number;
    status: 'pending' | 'preparing' | 'completed' | 'cancelled' | string;
    notes: string | null;
    created_at: string;
}
