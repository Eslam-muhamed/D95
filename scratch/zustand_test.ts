import { create } from 'zustand/vanilla';

interface State {
  items: any[];
  hasItems: () => boolean;
  addItem: () => void;
}

const store = create<State>((set, get) => ({
  items: [],
  hasItems: () => get().items.length > 0,
  addItem: () => set(state => ({ items: [...state.items, 1] }))
}));

console.log('Initial hasItems:', store.getState().hasItems());

let selectorRunCount = 0;
store.subscribe((state, prevState) => {
  const currentVal = state.hasItems();
  const prevVal = prevState.hasItems();
  if (currentVal !== prevVal) {
    console.log('Value changed:', currentVal);
  }
});

store.getState().addItem();
console.log('Final hasItems:', store.getState().hasItems());
