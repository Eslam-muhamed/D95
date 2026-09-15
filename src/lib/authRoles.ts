// Roles are now dynamically fetched from the database
let cachedRole: 'admin' | 'cashier' | null = null;

export const setRoleCache = (role: 'admin' | 'cashier' | null) => {
    cachedRole = role;
};

export const getRoleCache = () => cachedRole;

export const isAdmin = () => {
    return cachedRole === 'admin';
};

export const isCashier = () => {
    return cachedRole === 'cashier';
};

export const isStaff = () => {
    return cachedRole !== null;
};

