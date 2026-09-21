const { createStore } = require('zustand/vanilla');

const store = createStore((set, get) => ({
  items: [],
  hasItems: () => get().items.length > 0,
  addItem: () => set(state => ({ items: [...state.items, 1] })),
  clearItems: () => set({ items: [] })
}));

console.log("Initial items:", store.getState().items);

// This is what the selector does
const selector = state => state.hasItems();

let prev = selector(store.getState());
console.log("Initial selector result:", prev); // Should be false

store.subscribe((state) => {
  const current = selector(state);
  if (current !== prev) {
    console.log("Selector result changed from", prev, "to", current);
    prev = current;
  }
});

store.getState().addItem();
console.log("After add items:", store.getState().items);
store.getState().clearItems();
console.log("After clear items:", store.getState().items);
