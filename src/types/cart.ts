export type SugarLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type IceLevel = 'none' | 'little' | 'normal' | 'extra';

export interface ItemCustomization {
    quantity: number;
    sugar?: SugarLevel;
    ice?: IceLevel;
    extraShot?: boolean;
    cream?: boolean;
    honey?: boolean;
    toppings?: string[];
    notes?: string;
}

export interface CartItem {
    cartId: string;
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    customization: ItemCustomization;
}
