import re

with open("src/pages/CustomerDashboardPage.tsx", "r") as f:
    content = f.read()

# 1. Icons
content = content.replace(
    "import { Phone, ArrowRight, Star, History, AlertCircle, Calendar, UserCircle2, LogOut, Link as LinkIcon, ShoppingBag, Sparkles, ChevronLeft } from 'lucide-react';",
    "import { Phone, ArrowRight, Star, History, AlertCircle, Calendar, UserCircle2, LogOut, Link as LinkIcon, ShoppingBag, Sparkles, ChevronLeft, Gamepad2 } from 'lucide-react';"
)

# 2. Types
content = content.replace(
    "import type { DBCustomer, DBLoyaltyTransaction, DBOrder } from '@/types/database';",
    "import type { DBCustomer, DBLoyaltyTransaction, DBOrder, DBBooking } from '@/types/database';"
)

# 3. State
content = content.replace(
    "const [authOrders, setAuthOrders] = useState<DBOrder[]>([]);",
    "const [authOrders, setAuthOrders] = useState<DBOrder[]>([]);\n    const [authBookings, setAuthBookings] = useState<DBBooking[]>([]);"
)
content = content.replace(
    "const [activeTab, setActiveTab] = useState<'history' | 'orders'>('history');",
    "const [activeTab, setActiveTab] = useState<'history' | 'orders' | 'bookings'>('history');"
)

# 4. Fetch
fetch_old = """                const [txRes, ordersRes] = await Promise.all([
                    supabase
                        .from('loyalty_transactions')
                        .select('*')
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('orders')
                        .select('*')
                        .order('created_at', { ascending: false })
                ]);
                
                if (txRes.data) setAuthHistory(txRes.data);
                if (ordersRes.data) setAuthOrders(ordersRes.data);"""

fetch_new = """                const [txRes, ordersRes, bookingsRes] = await Promise.all([
                    supabase
                        .from('loyalty_transactions')
                        .select('*')
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('orders')
                        .select('*')
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('ps_bookings')
                        .select('*')
                        .eq('customer_phone', customerProfile.phone_number)
                        .order('created_at', { ascending: false })
                ]);
                
                if (txRes.data) setAuthHistory(txRes.data);
                if (ordersRes.data) setAuthOrders(ordersRes.data);
                if (bookingsRes.data) setAuthBookings(bookingsRes.data);"""

content = content.replace(fetch_old, fetch_new)

# 5. renderBookings
render_bookings = """
    const renderBookings = (bookings: DBBooking[], isFetching: boolean) => {
        if (isFetching) return <SkeletonList />;
        
        if (bookings.length === 0) return (
            <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl p-8 text-center mt-4 shadow-sm">
                <Gamepad2 className="w-10 h-10 text-[var(--text-3)] mx-auto mb-3 opacity-50" />
                <p className="text-[var(--text-2)] font-medium text-sm">لم تقم بأي حجوزات غرف مسبقاً.</p>
            </div>
        );

        return (
            <div className="mt-4 space-y-3">
                {bookings.map(booking => (
                    <div key={booking.id} className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl p-4 flex flex-col hover:border-[var(--c-brand-l)] transition-colors shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b border-[var(--c-border)] pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/5 flex items-center justify-center text-[var(--text-2)]">
                                    <Gamepad2 size={14} />
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--text-1)] text-sm">{booking.room_name || 'غرفة اللعب'}</p>
                                    <p className="text-[10px] text-[var(--text-3)]">{formatDate(booking.created_at || '')}</p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                booking.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                booking.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            }`}>
                                {booking.status === 'completed' ? 'مكتمل' : booking.status === 'cancelled' ? 'ملغي' : booking.status === 'confirmed' ? 'مؤكد' : 'معلق'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--text-2)] font-medium">الإجمالي:</span>
                            <span className="font-bold font-mono text-base text-[var(--text-1)]">{booking.total_amount} <span className="text-[10px] text-[var(--text-3)] font-sans">ج.م</span></span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };
"""

content = content.replace("    const renderVIPCard", render_bookings + "\n    const renderVIPCard")

# 6. Tabs UI
tabs_old = """                                    <button 
                                        onClick={() => setActiveTab('orders')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'orders' ? 'bg-[var(--bg-main)] text-[var(--text-1)] shadow-sm border border-[var(--c-border)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'}`}
                                    >
                                        <ShoppingBag size={16} />
                                        طلباتي
                                    </button>
                                </div>
                                
                                <div className="min-h-[300px]">
                                    {activeTab === 'history' 
                                        ? renderHistory(authHistory, fetchingAuthData) 
                                        : renderOrders(authOrders, fetchingAuthData)
                                    }
                                </div>"""

tabs_new = """                                    <button 
                                        onClick={() => setActiveTab('orders')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'orders' ? 'bg-[var(--bg-main)] text-[var(--text-1)] shadow-sm border border-[var(--c-border)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'}`}
                                    >
                                        <ShoppingBag size={16} />
                                        الكافيه
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('bookings')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'bookings' ? 'bg-[var(--bg-main)] text-[var(--text-1)] shadow-sm border border-[var(--c-border)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'}`}
                                    >
                                        <Gamepad2 size={16} />
                                        الغرف
                                    </button>
                                </div>
                                
                                <div className="min-h-[300px]">
                                    {activeTab === 'history' 
                                        ? renderHistory(authHistory, fetchingAuthData) 
                                        : activeTab === 'orders' 
                                        ? renderOrders(authOrders, fetchingAuthData)
                                        : renderBookings(authBookings, fetchingAuthData)
                                    }
                                </div>"""

content = content.replace(tabs_old, tabs_new)

with open("src/pages/CustomerDashboardPage.tsx", "w") as f:
    f.write(content)
