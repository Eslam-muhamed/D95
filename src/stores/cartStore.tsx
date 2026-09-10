import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import type { CartItem, CartBooking, CartTab } from '@/types/cart';
import { getItemUnitPrice } from '@/lib/cartUtils';

interface CartState {
    items: CartItem[];
    booking: CartBooking | null;
    isOpen: boolean;
    activeTab: CartTab;
}

type CartAction =
    | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'cartId'> }
    | { type: 'REMOVE_ITEM'; cartId: string }
    | { type: 'UPDATE_QTY'; cartId: string; qty: number }
    | { type: 'SET_BOOKING'; payload: CartBooking | null }
    | { type: 'REMOVE_BOOKING' }
    | { type: 'CLEAR' }
    | { type: 'CLEAR_CAFE' }
    | { type: 'SET_TAB'; tab: CartTab }
    | { type: 'OPEN'; tab?: CartTab }
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
                activeTab: 'cafe', // Switch to cafe tab when an item is added
            };
        }
        case 'REMOVE_ITEM': {
            const newItems = state.items.filter(i => i.cartId !== action.cartId);
            return {
                ...state,
                items: newItems,
                // If cafe items are empty but a booking exists, switch tab to playstation
                activeTab: newItems.length === 0 && state.booking ? 'playstation' : state.activeTab,
            };
        }
        case 'UPDATE_QTY': {
            if (action.qty <= 0) {
                const newItems = state.items.filter(i => i.cartId !== action.cartId);
                return {
                    ...state,
                    items: newItems,
                    activeTab: newItems.length === 0 && state.booking ? 'playstation' : state.activeTab,
                };
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
            return {
                ...state,
                booking: action.payload,
                activeTab: 'playstation', // Switch to PS tab when a room booking is set
            };
        case 'REMOVE_BOOKING':
            return {
                ...state,
                booking: null,
                activeTab: state.items.length > 0 ? 'cafe' : state.activeTab,
            };
        case 'CLEAR':
            return { ...state, items: [], booking: null };
        case 'CLEAR_CAFE':
            return {
                ...state,
                items: [],
                activeTab: state.booking ? 'playstation' : 'cafe',
            };
        case 'SET_TAB':
            return { ...state, activeTab: action.tab };
        case 'OPEN': {
            let nextTab = state.activeTab;
            if (action.tab) {
                nextTab = action.tab;
            } else if (state.booking && state.items.length === 0) {
                nextTab = 'playstation';
            } else if (state.items.length > 0 && !state.booking) {
                nextTab = 'cafe';
            }
            return { ...state, isOpen: true, activeTab: nextTab };
        }
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
    activeTab: CartTab;
    total: number;
    totalPrice: number;
    cafeTotal: number;
    bookingTotal: number;
    itemCount: number;
    totalItems: number;
    cafeCount: number;
    hasCafeItems: boolean;
    hasBooking: boolean;
    addItem: (item: Omit<CartItem, 'cartId'>) => void;
    removeItem: (cartId: string) => void;
    updateQty: (cartId: string, qty: number) => void;
    setBooking: (booking: CartBooking | null) => void;
    removeBooking: () => void;
    clear: () => void;
    clearCart: () => void;
    clearCafe: () => void;
    setActiveTab: (tab: CartTab) => void;
    openCart: (tab?: CartTab) => void;
    closeCart: () => void;
}

const CartContext = createContext<CartContextValue>({} as CartContextValue);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const initialData = useMemo(() => loadInitialCart(), []);
    const [state, dispatch] = useReducer(cartReducer, {
        ...initialData,
        isOpen: false,
        activeTab: initialData.booking && initialData.items.length === 0 ? 'playstation' : 'cafe',
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

    const cafeTotal = useMemo(
        () => state.items.reduce((sum, item) => sum + getItemUnitPrice(item) * item.customization.quantity, 0),
        [state.items]
    );
    const bookingTotal = state.booking ? state.booking.subtotal : 0;
    const total = cafeTotal + bookingTotal;

    const cafeCount = useMemo(
        () => state.items.reduce((sum, item) => sum + item.customization.quantity, 0),
        [state.items]
    );
    const hasBooking = Boolean(state.booking);
    const hasCafeItems = state.items.length > 0;
    const itemCount = cafeCount + (hasBooking ? 1 : 0);

    const addItem = useCallback((item: Omit<CartItem, 'cartId'>) => dispatch({ type: 'ADD_ITEM', payload: item }), []);
    const removeItem = useCallback((cartId: string) => dispatch({ type: 'REMOVE_ITEM', cartId }), []);
    const updateQty = useCallback((cartId: string, qty: number) => {
        dispatch({ type: 'UPDATE_QTY', cartId, qty });
    }, []);
    const setBooking = useCallback((booking: CartBooking | null) => dispatch({ type: 'SET_BOOKING', payload: booking }), []);
    const removeBooking = useCallback(() => dispatch({ type: 'REMOVE_BOOKING' }), []);
    const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);
    const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);
    const clearCafe = useCallback(() => dispatch({ type: 'CLEAR_CAFE' }), []);
    const setActiveTab = useCallback((tab: CartTab) => dispatch({ type: 'SET_TAB', tab }), []);
    const openCart = useCallback((tab?: CartTab) => dispatch({ type: 'OPEN', tab }), []);
    const closeCart = useCallback(() => dispatch({ type: 'CLOSE' }), []);

    const contextValue = useMemo<CartContextValue>(() => ({
        items: state.items,
        booking: state.booking,
        isOpen: state.isOpen,
        activeTab: state.activeTab,
        total,
        totalPrice: total,
        cafeTotal,
        bookingTotal,
        itemCount,
        totalItems: itemCount,
        cafeCount,
        hasCafeItems,
        hasBooking,
        addItem,
        removeItem,
        updateQty,
        setBooking,
        removeBooking,
        clear,
        clearCart,
        clearCafe,
        setActiveTab,
        openCart,
        closeCart,
    }), [
        state.items,
        state.booking,
        state.isOpen,
        state.activeTab,
        total,
        cafeTotal,
        bookingTotal,
        itemCount,
        cafeCount,
        hasCafeItems,
        hasBooking,
        addItem,
        removeItem,
        updateQty,
        setBooking,
        removeBooking,
        clear,
        clearCart,
        clearCafe,
        setActiveTab,
        openCart,
        closeCart,
    ]);

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
    return useContext(CartContext);
}
