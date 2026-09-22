import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

import CartSheet from '@/features/cart/components/CartSheet';
import BottomNav from '@/components/layout/BottomNav';
import AdminProtectedRoute from '@/features/auth/components/AdminProtectedRoute';
import SplashScreen from '@/components/features/SplashScreen';

import {
    preloadPlaystationRoute,
    preloadMenuRoute,
    preloadTournamentsRoute,
    preloadBookingDetailsRoute,
    preloadBookingPaymentRoute,
    preloadBookingSuccessRoute,
    preloadTournamentRegistrationRoute,
    preloadTournamentDetailRoute,
    preloadCustomerDashboardRoute,
    preloadCustomerLoginRoute
} from '@/lib/routePreloaders';

// Statically import primary public tabs & customer booking flow for 0ms instantaneous navigation
import GatewayPage from '@/pages/GatewayPage';

const PlaystationPage = lazy(preloadPlaystationRoute);
const MenuPage = lazy(preloadMenuRoute);
const BookingDetailsPage = lazy(preloadBookingDetailsRoute);
const BookingPaymentPage = lazy(preloadBookingPaymentRoute);
const BookingSuccessPage = lazy(preloadBookingSuccessRoute);

const CustomerDashboardPage = lazy(preloadCustomerDashboardRoute);
const CustomerLoginPage = lazy(preloadCustomerLoginRoute);

const TournamentsPage = lazy(preloadTournamentsRoute);
const TournamentRegistrationPage = lazy(preloadTournamentRegistrationRoute);
const TournamentDetailPage = lazy(preloadTournamentDetailRoute);

// Route-level Code Splitting for back-office admin routes only
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'));
const AdminLoginPage = lazy(() => import('@/features/admin/pages/AdminLoginPage'));

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

export function AppRoutes() {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <div className="w-full min-h-screen bg-[var(--bg-main)] flex flex-col selection:bg-red-500/30">
            <SplashScreen onComplete={() => console.log('Splash finished')} />
            {!isAdminRoute && <CartSheet />}
            <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                    <Route path="/" element={<GatewayPage />} />
                    <Route path="/playstation" element={<PlaystationPage />} />
                    <Route path="/playstation/booking" element={<BookingDetailsPage />} />
                    <Route path="/playstation/payment" element={<BookingPaymentPage />} />
                    <Route path="/playstation/success" element={<BookingSuccessPage />} />
                    <Route path="/menu" element={<MenuPage />} />
                    <Route path="/customer" element={<CustomerDashboardPage />} />
                    <Route path="/login" element={<CustomerLoginPage />} />
                    <Route path="/tournaments" element={<TournamentsPage />} />
                    <Route path="/tournaments/register/:id" element={<TournamentRegistrationPage />} />
                    <Route path="/tournament/:id" element={<TournamentDetailPage />} />
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
