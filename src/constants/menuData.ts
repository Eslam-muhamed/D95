import { hotItems } from './hotItems';
import { coldItems } from './coldItems';

export const allItems = [...hotItems, ...coldItems];
export { hotItems, coldItems };
