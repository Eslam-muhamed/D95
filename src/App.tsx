import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from '@/stores/themeStore';
import { CartProvider } from '@/stores/cartStore';
import CartSheet from '@/components/features/CartSheet';
import BottomNav from '@/components/layout/BottomNav';
import SplashScreen from '@/components/features/SplashScreen';
import MenuPage from '@/pages/MenuPage';
import GatewayPage from '@/pages/GatewayPage';
import PlaystationPage from '@/pages/PlaystationPage';
import BookingDetailsPage from '@/pages/BookingDetailsPage';
import BookingPaymentPage from '@/pages/BookingPaymentPage';
import BookingSuccessPage from '@/pages/BookingSuccessPage';

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

function PageWrapper({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="w-full min-h-screen flex flex-col"
        >
            {children}
        </motion.div>
    );
}

function AppRoutes() {
    const location = useLocation();

    return (
        <div className="w-full min-h-screen bg-[var(--bg-main)] flex flex-col selection:bg-red-500/30">
            <CartSheet />
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<PageWrapper><GatewayPage /></PageWrapper>} />
                    <Route path="/playstation" element={<PageWrapper><PlaystationPage /></PageWrapper>} />
                    <Route path="/playstation/booking" element={<PageWrapper><BookingDetailsPage /></PageWrapper>} />
                    <Route path="/playstation/payment" element={<PageWrapper><BookingPaymentPage /></PageWrapper>} />
                    <Route path="/playstation/success" element={<PageWrapper><BookingSuccessPage /></PageWrapper>} />
                    <Route path="/menu" element={<PageWrapper><MenuPage /></PageWrapper>} />
                    <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
                </Routes>
            </AnimatePresence>
            <BottomNav />
            <Toaster position="top-center" richColors />
        </div>
    );
}

export default function App() {
    const [splashDone, setSplashDone] = useState(false);

    return (
        <ThemeProvider>
            <CartProvider>
                {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
                <AppContent />
            </CartProvider>
        </ThemeProvider>
    );
}
