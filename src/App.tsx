import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '@/features/auth/stores/authStore';
import { ThemeProvider } from '@/stores/themeStore';
import { CartProvider } from '@/features/cart/stores/cartStore';
import ErrorBoundary from '@/components/features/ErrorBoundary';
import { preloadMenuData } from '@/features/menu/services/menuService';
import { AppRoutes } from './routes';

function AppContent() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}

export default function App() {
    const { initialize } = useAuth();

    useEffect(() => {
        initialize();
        // Warm up menu cache during idle time so first menu visit is instant 0ms
        const timer = setTimeout(() => {
            preloadMenuData();
        }, 500);
        return () => clearTimeout(timer);
    }, [initialize]);

    return (
        <ErrorBoundary>
            <ThemeProvider>
                <CartProvider>
                    <AppContent />
                </CartProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}
