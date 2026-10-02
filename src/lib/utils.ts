import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatWhatsAppNumber(phone: string): string {
    if (!phone) return '';
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('01')) {
        clean = '2' + clean;
    } else if (clean.startsWith('1')) {
        clean = '20' + clean;
    }
    return clean;
}
