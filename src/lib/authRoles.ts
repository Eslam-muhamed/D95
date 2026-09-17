// Roles are now dynamically fetched from the database (Admin only)
let cachedRole: 'admin' | null = null;

export const setRoleCache = (role: 'admin' | null) => {
    cachedRole = role;
};

export const getRoleCache = () => cachedRole;

export const isAdmin = () => {
    return cachedRole === 'admin';
};

export const isCashier = () => {
    return false;
};

export const isStaff = () => {
    return cachedRole === 'admin';
};

