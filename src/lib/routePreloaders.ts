// Primary Public Tabs
export const preloadPlaystationRoute = () => import('@/pages/PlaystationPage');
export const preloadMenuRoute = () => import('@/features/menu/pages/MenuPage');
export const preloadTournamentsRoute = () => import('@/pages/TournamentsPage');

// Customer Booking Flow
export const preloadBookingDetailsRoute = () => import('@/features/booking/pages/BookingDetailsPage');
export const preloadBookingPaymentRoute = () => import('@/features/booking/pages/BookingPaymentPage');
export const preloadBookingSuccessRoute = () => import('@/features/booking/pages/BookingSuccessPage');

// Additional Tournament Routes
export const preloadTournamentRegistrationRoute = () => import('@/pages/TournamentRegistrationPage');
export const preloadTournamentDetailRoute = () => import('@/pages/TournamentDetailPage');

// Customer Profile Flow
export const preloadCustomerDashboardRoute = () => import('@/pages/CustomerDashboardPage');
export const preloadCustomerLoginRoute = () => import('@/features/auth/pages/CustomerLoginPage');
