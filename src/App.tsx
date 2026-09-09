import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/stores/themeStore';
import { CartProvider } from '@/stores/cartStore';
import CartSheet from '@/components/features/CartSheet';
import BottomNav from '@/components/layout/BottomNav';
import SplashScreen from '@/components/features/SplashScreen';
import ErrorBoundary from '@/components/features/ErrorBoundary';
import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import { preloadMenuData } from '@/services/menuService';

// Statically import primary public tabs for 0ms instantaneous bottom bar navigation
import GatewayPage from '@/pages/GatewayPage';
import PlaystationPage from '@/pages/PlaystationPage';
import MenuPage from '@/pages/MenuPage';

// Route-level Code Splitting for secondary checkout & admin routes
const BookingDetailsPage = lazy(() => import('@/pages/BookingDetailsPage'));
const BookingPaymentPage = lazy(() => import('@/pages/BookingPaymentPage'));
const BookingSuccessPage = lazy(() => import('@/pages/BookingSuccessPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));

function PageLoadingFallback() {
    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center text-red-500">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: 'var(--bg-main)' }}>
            <span className="font-display text-6xl brand-text">404</span>
            <p className="font-body text-lg" style={{ color: 'var(--text-3)' }}>الصفحة مش موجودة</p>
        </div>
    );
}

function AppContent() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}

function AppRoutes() {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <div className="w-full min-h-screen bg-[var(--bg-main)] flex flex-col selection:bg-red-500/30">
            {!isAdminRoute && <CartSheet />}
            <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                    <Route path="/" element={<GatewayPage />} />
                    <Route path="/playstation" element={<PlaystationPage />} />
                    <Route path="/playstation/booking" element={<BookingDetailsPage />} />
                    <Route path="/playstation/payment" element={<BookingPaymentPage />} />
                    <Route path="/playstation/success" element={<BookingSuccessPage />} />
                    <Route path="/menu" element={<MenuPage />} />
                    <Route
                        path="/admin"
                        element={
                            <AdminProtectedRoute>
                                <AdminDashboardPage />
                            </AdminProtectedRoute>
                        }
                    />
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
            {!isAdminRoute && <BottomNav />}
            <Toaster position="top-center" richColors />
        </div>
    );
}

export default function App() {
    // Check sessionStorage immediately to avoid any splash delay for returning or navigating users
    const [splashDone, setSplashDone] = useState(() => {
        try {
            return !!sessionStorage.getItem('d95_splash_shown');
        } catch {
            return true;
        }
    });

    useEffect(() => {
        // Warm up menu cache during idle time so first menu visit is instant 0ms
        const timer = setTimeout(() => {
            preloadMenuData();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <ErrorBoundary>
            <ThemeProvider>
                <CartProvider>
                    {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
                    <AppContent />
                </CartProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}
