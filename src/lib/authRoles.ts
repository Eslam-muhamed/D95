export const ADMIN_EMAILS = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_EMAILS) || 
    'admin@d95.com'
).split(',').map((e: string) => e.trim().toLowerCase());

export const CASHIER_EMAILS = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CASHIER_EMAILS) || 
    'cashier@d95.com'
).split(',').map((e: string) => e.trim().toLowerCase());

export const isAdmin = (email?: string | null) => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
};

export const isCashier = (email?: string | null) => {
    if (!email) return false;
    return CASHIER_EMAILS.includes(email.toLowerCase());
};

export const isStaff = (email?: string | null) => {
    return isAdmin(email) || isCashier(email);
};
