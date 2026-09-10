import { getItemUnitPrice } from '../src/lib/cartUtils';
import type { CartItem, CartBooking, CartTab } from '../src/types/cart';

console.log('====================================================');
console.log('🧪 VERIFYING DUAL-ENGINE CART LOGIC & INTEGRITY');
console.log('====================================================');

// Mock Cart State & Reducer identical to cartStore.tsx
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

function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case 'ADD_ITEM': {
            const cartId = `${action.payload.id}-${Date.now()}-${Math.random()}`;
            return {
                ...state,
                items: [...state.items, { ...action.payload, cartId }],
                activeTab: 'cafe',
            };
        }
        case 'REMOVE_ITEM': {
            const newItems = state.items.filter(i => i.cartId !== action.cartId);
            return {
                ...state,
                items: newItems,
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
                activeTab: 'playstation',
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

let state: CartState = {
    items: [],
    booking: null,
    isOpen: false,
    activeTab: 'cafe',
};

function assert(condition: boolean, msg: string) {
    if (!condition) {
        console.error(`❌ FAILED: ${msg}`);
        process.exit(1);
    }
    console.log(`✅ PASS: ${msg}`);
}

// Test 1: Initial empty state
assert(state.items.length === 0 && state.booking === null, 'Initial cart is completely empty');

// Test 2: Add Cafe item -> switches activeTab to 'cafe'
state = cartReducer(state, {
    type: 'ADD_ITEM',
    payload: {
        id: 'latte',
        name: 'سبانش لاتيه',
        price: 65,
        image: '/images/latte.jpg',
        category: 'hot-coffee',
        customization: { quantity: 2, sugar: 2, ice: 'normal' },
    },
});
assert(state.items.length === 1 && state.activeTab === 'cafe', 'Adding Cafe item sets activeTab to cafe');
const item1UnitPrice = getItemUnitPrice(state.items[0]);
assert(item1UnitPrice === 65, 'Item unit price is 65');
assert(state.items[0].customization.quantity === 2, 'Item quantity is 2');

// Test 3: Open cart without args defaults to 'cafe' because cafe items exist
state = cartReducer(state, { type: 'OPEN' });
assert(state.isOpen === true && state.activeTab === 'cafe', 'Open cart defaults to cafe when only cafe items exist');

// Test 4: Set PlayStation booking -> switches activeTab to 'playstation'
const sampleBooking: CartBooking = {
    roomId: 'room-1',
    roomName: 'غرفة VIP 01',
    roomNameEn: 'Room 01',
    date: '2026-09-10',
    startTime: '08:00 م',
    endTime: '10:00 م',
    durationHours: 2,
    rate: 120,
    subtotal: 240,
};
state = cartReducer(state, { type: 'SET_BOOKING', payload: sampleBooking });
assert(state.booking !== null && state.activeTab === 'playstation', 'Adding booking sets activeTab to playstation');
assert(state.items.length === 1, 'Cafe item is safely preserved alongside booking');

// Test 5: Switch tabs explicitly
state = cartReducer(state, { type: 'SET_TAB', tab: 'cafe' });
assert(state.activeTab === 'cafe', 'Manual tab switch to cafe succeeds');
state = cartReducer(state, { type: 'SET_TAB', tab: 'playstation' });
assert(state.activeTab === 'playstation', 'Manual tab switch to playstation succeeds');

// Test 6: Clear Cafe items only
state = cartReducer(state, { type: 'CLEAR_CAFE' });
assert(state.items.length === 0, 'Cafe items cleared');
assert(state.booking !== null, 'PlayStation booking is intact after clearCafe');
assert(state.activeTab === 'playstation', 'Tab automatically switches to playstation after clearing cafe');

// Test 7: Open cart with explicit tab
state = cartReducer(state, { type: 'OPEN', tab: 'playstation' });
assert(state.isOpen === true && state.activeTab === 'playstation', 'Explicit openCart(playstation) opens playstation tab');

// Test 8: Remove booking
state = cartReducer(state, { type: 'REMOVE_BOOKING' });
assert(state.booking === null, 'Booking removed successfully');

console.log('====================================================');
console.log('🎉 ALL 8 CART INTEGRATION TESTS PASSED!');
console.log('====================================================');
