import React, { createContext, useContext, useReducer } from 'react';
import type { CartItem, ItemCustomization } from '@/types/cart';

interface CartState {
    items: CartItem[];
    isOpen: boolean;
}

type CartAction =
    | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'cartId'> }
    | { type: 'REMOVE_ITEM'; cartId: string }
    | { type: 'UPDATE_QTY'; cartId: string; qty: number }
    | { type: 'CLEAR' }
    | { type: 'OPEN' }
    | { type: 'CLOSE' };

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
        case 'CLEAR':
            return { ...state, items: [] };
        case 'OPEN':
            return { ...state, isOpen: true };
        case 'CLOSE':
            return { ...state, isOpen: false };
        default:
            return state;
    }
}

import { getItemUnitPrice } from '@/lib/cartUtils';

interface CartContextValue {
    items: CartItem[];
    isOpen: boolean;
    total: number;
    totalPrice: number;
    itemCount: number;
    totalItems: number;
    addItem: (item: Omit<CartItem, 'cartId'>) => void;
    removeItem: (cartId: string) => void;
    updateQty: (cartId: string, qty: number) => void;
    clear: () => void;
    clearCart: () => void;
    openCart: () => void;
    closeCart: () => void;
}

const CartContext = createContext<CartContextValue>({} as CartContextValue);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });

    const total = state.items.reduce(
        (sum, item) => sum + getItemUnitPrice(item) * item.customization.quantity,
        0
    );
    const itemCount = state.items.reduce((sum, item) => sum + item.customization.quantity, 0);

    const addItem = (item: Omit<CartItem, 'cartId'>) => dispatch({ type: 'ADD_ITEM', payload: item });
    const removeItem = (cartId: string) => dispatch({ type: 'REMOVE_ITEM', cartId });
    const updateQty = (cartId: string, qty: number) => {
        // If delta is passed (like -1 or +1), convert to absolute quantity if needed
        const currentItem = state.items.find(i => i.cartId === cartId);
        if (currentItem && (qty === -1 || qty === 1)) {
            dispatch({ type: 'UPDATE_QTY', cartId, qty: currentItem.customization.quantity + qty });
        } else {
            dispatch({ type: 'UPDATE_QTY', cartId, qty });
        }
    };
    const clear = () => dispatch({ type: 'CLEAR' });
    const clearCart = () => dispatch({ type: 'CLEAR' });
    const openCart = () => dispatch({ type: 'OPEN' });
    const closeCart = () => dispatch({ type: 'CLOSE' });

    return (
        <CartContext.Provider
            value={{
                items: state.items,
                isOpen: state.isOpen,
                total,
                totalPrice: total,
                itemCount,
                totalItems: itemCount,
                addItem,
                removeItem,
                updateQty,
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
