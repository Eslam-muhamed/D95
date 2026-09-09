import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { CartItem, CartBooking } from '@/types/cart';
import { getItemUnitPrice } from '@/lib/cartUtils';

interface CartState {
    items: CartItem[];
    booking: CartBooking | null;
    isOpen: boolean;
}

type CartAction =
    | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'cartId'> }
    | { type: 'REMOVE_ITEM'; cartId: string }
    | { type: 'UPDATE_QTY'; cartId: string; qty: number }
    | { type: 'SET_BOOKING'; payload: CartBooking | null }
    | { type: 'REMOVE_BOOKING' }
    | { type: 'CLEAR' }
    | { type: 'OPEN' }
    | { type: 'CLOSE' };

const STORAGE_KEY = 'd95_unified_cart';

function loadInitialCart(): Pick<CartState, 'items' | 'booking'> {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                items: Array.isArray(parsed.items) ? parsed.items : [],
                booking: parsed.booking || null,
            };
        }
    } catch {
        // Silently fallback to empty cart
    }
    return { items: [], booking: null };
}

function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case 'ADD_ITEM': {
            const cartId = `${action.payload.id}-${Date.now()}-${Math.random()}`;
            return {
                ...state,
                items: [...state.items, { ...action.payload, cartId }],
            };
        }
        case 'REMOVE_ITEM':
            return { ...state, items: state.items.filter(i => i.cartId !== action.cartId) };
        case 'UPDATE_QTY': {
            if (action.qty <= 0) {
                return { ...state, items: state.items.filter(i => i.cartId !== action.cartId) };
            }
            return {
                ...state,
                items: state.items.map(i =>
                    i.cartId === action.cartId
                        ? { ...i, customization: { ...i.customization, quantity: action.qty } }
                        : i
                ),
            };
        }
        case 'SET_BOOKING':
            return { ...state, booking: action.payload };
        case 'REMOVE_BOOKING':
            return { ...state, booking: null };
        case 'CLEAR':
            return { ...state, items: [], booking: null };
        case 'OPEN':
            return { ...state, isOpen: true };
        case 'CLOSE':
            return { ...state, isOpen: false };
        default:
            return state;
    }
}

interface CartContextValue {
    items: CartItem[];
    booking: CartBooking | null;
    isOpen: boolean;
    total: number;
    totalPrice: number;
    cafeTotal: number;
    bookingTotal: number;
    itemCount: number;
    totalItems: number;
    addItem: (item: Omit<CartItem, 'cartId'>) => void;
    removeItem: (cartId: string) => void;
    updateQty: (cartId: string, qty: number) => void;
    setBooking: (booking: CartBooking | null) => void;
    removeBooking: () => void;
    clear: () => void;
    clearCart: () => void;
    openCart: () => void;
    closeCart: () => void;
}

const CartContext = createContext<CartContextValue>({} as CartContextValue);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(cartReducer, {
        ...loadInitialCart(),
        isOpen: false,
    });

    // Persist cart to localStorage whenever items or booking change
    useEffect(() => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ items: state.items, booking: state.booking })
            );
        } catch {
            // Ignore quota errors
        }
    }, [state.items, state.booking]);

    const cafeTotal = state.items.reduce(
        (sum, item) => sum + getItemUnitPrice(item) * item.customization.quantity,
        0
    );
    const bookingTotal = state.booking ? state.booking.subtotal : 0;
    const total = cafeTotal + bookingTotal;

    const cafeItemsCount = state.items.reduce((sum, item) => sum + item.customization.quantity, 0);
    const itemCount = cafeItemsCount + (state.booking ? 1 : 0);

    const addItem = (item: Omit<CartItem, 'cartId'>) => dispatch({ type: 'ADD_ITEM', payload: item });
    const removeItem = (cartId: string) => dispatch({ type: 'REMOVE_ITEM', cartId });
    const updateQty = (cartId: string, qty: number) => {
        const currentItem = state.items.find(i => i.cartId === cartId);
        if (currentItem && (qty === -1 || qty === 1)) {
            dispatch({ type: 'UPDATE_QTY', cartId, qty: currentItem.customization.quantity + qty });
        } else {
            dispatch({ type: 'UPDATE_QTY', cartId, qty });
        }
    };
    const setBooking = (booking: CartBooking | null) => dispatch({ type: 'SET_BOOKING', payload: booking });
    const removeBooking = () => dispatch({ type: 'REMOVE_BOOKING' });
    const clear = () => dispatch({ type: 'CLEAR' });
    const clearCart = () => dispatch({ type: 'CLEAR' });
    const openCart = () => dispatch({ type: 'OPEN' });
    const closeCart = () => dispatch({ type: 'CLOSE' });

    return (
        <CartContext.Provider
            value={{
                items: state.items,
                booking: state.booking,
                isOpen: state.isOpen,
                total,
                totalPrice: total,
                cafeTotal,
                bookingTotal,
                itemCount,
                totalItems: itemCount,
                addItem,
                removeItem,
                updateQty,
                setBooking,
                removeBooking,
                clear,
                clearCart,
                openCart,
                closeCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
    return useContext(CartContext);
}
