import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    Legend, AreaChart, Area, Cell
} from 'recharts';
import { 
    TrendingUp, 
    Gamepad2, 
    Activity,
    CreditCard,
    Coffee,
    Clock,
    Users,
    Filter,
    XCircle,
    MousePointerClick,
    Award
} from 'lucide-react';
import { toast } from 'sonner';

interface DailyRevenue {
    date: string;
    psRevenue: number;
    cafeRevenue: number;
    totalRevenue: number;
    rawDate: string;
}

interface RoomPopularity {
    name: string;
    count: number;
    revenue: number;
}

interface PeakHour {
    hour: string;
    count: number;
}

interface TopCustomer {
    name: string;
    phone: string;
    visits: number;
    revenue: number;
}

export default function AnalyticsTab() {
    const [isLoading, setIsLoading] = useState(true);
    
    // Server Filters State
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
    const [roomFilter, setRoomFilter] = useState<string>('all');
    const [availableRooms, setAvailableRooms] = useState<string[]>([]);
    
    // Raw Data State (For Client-Side Interactive Filtering)
    const [rawBookings, setRawBookings] = useState<any[]>([]);
    const [rawOrders, setRawOrders] = useState<any[]>([]);

    // Interactive Filters State
    const [interactiveRoom, setInteractiveRoom] = useState<string | null>(null);
    const [interactiveDate, setInteractiveDate] = useState<string | null>(null);

    const fetchAnalyticsData = async () => {
        try {
            setIsLoading(true);
            // Clear interactive filters when fetching new server data
            setInteractiveRoom(null);
            setInteractiveDate(null);

            // Fetch Bookings
            let bookingsQuery = supabase
                .from('ps_bookings')
                .select('booking_date, start_datetime, status, total_amount, room_name, customer_name, customer_phone')
                .gte('booking_date', startDate)
                .lte('booking_date', endDate);
                
            if (roomFilter !== 'all') {
                bookingsQuery = bookingsQuery.eq('room_name', roomFilter);
            }

            const { data: bookingsData, error: bookingsError } = await bookingsQuery;
            if (bookingsError) throw bookingsError;

            // Fetch Orders (Cafe) - Only if roomFilter is all
            let ordersData: any[] = [];
            if (roomFilter === 'all') {
                const { data, error: ordersError } = await supabase
                    .from('orders')
                    .select('created_at, status, total_amount, customer_name, customer_phone')
                    .gte('created_at', startDate)
                    .lte('created_at', endDate + 'T23:59:59');

                if (ordersError) throw ordersError;
                ordersData = data || [];
            }

            setRawBookings(bookingsData || []);
            setRawOrders(ordersData || []);

            // Update available rooms dropdown
            const roomsSet = new Set<string>();
            (bookingsData || []).forEach(b => {
                if (b.room_name) roomsSet.add(b.room_name);
            });
            if (roomFilter === 'all' && roomsSet.size > 0) {
                setAvailableRooms(Array.from(roomsSet));
            }

        } catch (err: any) {
            console.error("Error fetching analytics:", err);
            toast.error("حدث خطأ أثناء جلب بيانات التحليلات");
        } finally {
            setIsLoading(false);
        }
    };

    // Load on mount
    useEffect(() => {
        fetchAnalyticsData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --------------------------------------------------------
    // Memoized Data Processing (Applies Interactive Filters)
    // --------------------------------------------------------
    const { 
        dailyRevenue, 
        roomStats, 
        peakHours, 
        topCustomers,
        totalRevenue, 
        psRevenueTotal, 
        cafeRevenueTotal, 
        totalBookings 
    } = useMemo(() => {
        const dailyMap = new Map<string, { ps: number, cafe: number }>();
        const roomMap = new Map<string, { count: number, revenue: number }>();
        const hoursMap = new Map<number, number>(); // 0-23
        const customerMap = new Map<string, TopCustomer>();

        let tRev = 0;
        let psRev = 0;
        let cafeRev = 0;
        let tBookings = 0;

        // Apply Interactive Filters to Bookings
        const filteredBookings = rawBookings.filter(booking => {
            if (booking.status !== 'confirmed' && booking.status !== 'completed') return false;
            if (interactiveRoom && booking.room_name !== interactiveRoom) return false;
            if (interactiveDate && booking.booking_date !== interactiveDate) return false;
            return true;
        });

        // Apply Interactive Filters to Orders
        const filteredOrders = rawOrders.filter(order => {
            if (order.status !== 'completed' && order.status !== 'delivered' && order.status !== 'paid') return false;
            const orderDate = order.created_at.split('T')[0];
            // If filtering by room, cafe orders don't have a room, so we might want to hide them OR show them.
            // Usually, if a room is selected, we hide cafe orders unless they are linked to the room. 
            // Since we don't have room linking here, we hide them to focus on the room's direct revenue.
            if (interactiveRoom) return false; 
            if (interactiveDate && orderDate !== interactiveDate) return false;
            return true;
        });

        // Process Bookings
        filteredBookings.forEach(booking => {
            const date = booking.booking_date;
            const amount = Number(booking.total_amount) || 0;
            const rName = booking.room_name || 'غرفة غير معروفة';
            const cName = booking.customer_name?.trim() || 'عميل غير مسجل';
            const cPhone = booking.customer_phone?.trim() || 'unknown';
            
            tBookings++;
            psRev += amount;
            tRev += amount;

            // Daily Revenue
            if (!dailyMap.has(date)) dailyMap.set(date, { ps: 0, cafe: 0 });
            dailyMap.get(date)!.ps += amount;

            // Room Popularity
            if (!roomMap.has(rName)) roomMap.set(rName, { count: 0, revenue: 0 });
            roomMap.get(rName)!.count += 1;
            roomMap.get(rName)!.revenue += amount;

            // Peak Hours
            if (booking.start_datetime) {
                const hour = new Date(booking.start_datetime).getHours();
                hoursMap.set(hour, (hoursMap.get(hour) || 0) + 1);
            }

            // Customers
            if (cPhone !== 'unknown' || cName !== 'عميل غير مسجل') {
                const key = cPhone !== 'unknown' ? cPhone : cName;
                if (!customerMap.has(key)) {
                    customerMap.set(key, { name: cName, phone: cPhone !== 'unknown' ? cPhone : '', visits: 0, revenue: 0 });
                }
                const cInfo = customerMap.get(key)!;
                cInfo.visits += 1;
                cInfo.revenue += amount;
            }
        });

        // Process Orders
        filteredOrders.forEach(order => {
            const date = order.created_at.split('T')[0];
            const amount = Number(order.total_amount) || 0;
            const cName = order.customer_name?.trim() || 'عميل غير مسجل';
            const cPhone = order.customer_phone?.trim() || 'unknown';

            cafeRev += amount;
            tRev += amount;

            if (!dailyMap.has(date)) dailyMap.set(date, { ps: 0, cafe: 0 });
            dailyMap.get(date)!.cafe += amount;

            // Customers
            if (cPhone !== 'unknown' || cName !== 'عميل غير مسجل') {
                const key = cPhone !== 'unknown' ? cPhone : cName;
                if (!customerMap.has(key)) {
                    customerMap.set(key, { name: cName, phone: cPhone !== 'unknown' ? cPhone : '', visits: 0, revenue: 0 });
                }
                const cInfo = customerMap.get(key)!;
                cInfo.revenue += amount;
                // If it's just a cafe order, we might not count it as a "visit" to not double count, 
                // but usually if they order via cafe they are visiting. We will count it.
                cInfo.visits += 1;
            }
        });

        // Format Outputs
        const formattedDaily = Array.from(dailyMap.entries())
            .map(([date, stats]) => ({
                date: new Date(date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
                psRevenue: stats.ps,
                cafeRevenue: stats.cafe,
                totalRevenue: stats.ps + stats.cafe,
                rawDate: date
            }))
            .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

        const formattedRooms = Array.from(roomMap.entries())
            .map(([name, stats]) => ({
                name,
                count: stats.count,
                revenue: stats.revenue
            }))
            .sort((a, b) => b.revenue - a.revenue);

        const formattedHours: PeakHour[] = [];
        for (let i = 0; i < 24; i++) {
            const hourStr = `${i.toString().padStart(2, '0')}:00`;
            formattedHours.push({
                hour: hourStr,
                count: hoursMap.get(i) || 0
            });
        }

        const topCustomers = Array.from(customerMap.values())
            .filter(c => c.name !== 'عميل غير مسجل' && c.revenue > 0)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 3); // Top 3 customers

        return {
            dailyRevenue: formattedDaily,
            roomStats: formattedRooms,
            peakHours: formattedHours,
            topCustomers,
            totalRevenue: tRev,
            psRevenueTotal: psRev,
            cafeRevenueTotal: cafeRev,
            totalBookings: tBookings
        };

    }, [rawBookings, rawOrders, interactiveRoom, interactiveDate]);

    // Custom Tooltip for Stacked Bar Chart
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl" dir="rtl">
                    <p className="font-bold text-slate-800 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm font-semibold flex justify-between gap-4">
                            <span>{entry.name === 'psRevenue' ? 'البلايستيشن:' : 'الكافيه:'}</span>
                            <span>{entry.value.toLocaleString()} ج.م</span>
                        </p>
                    ))}
                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between gap-4">
                        <span className="text-sm font-black text-slate-900">الإجمالي:</span>
                        <span className="text-sm font-black text-slate-900">
                            {(payload[0].payload.totalRevenue).toLocaleString()} ج.م
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-6 px-2 sm:px-4 fade-in" dir="rtl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">تحليلات الأعمال (BI)</h2>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                            تتبع أداء المكان واتخذ قرارات مبنية على البيانات. <span className="text-indigo-600 font-bold hidden sm:inline">يمكنك الضغط على أي عمود في الرسوم البيانية لفلترة باقي الداتا!</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Server Filter Controls */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200 mb-6 flex flex-col lg:flex-row items-end gap-4 w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full flex justify-end items-start p-3 -z-10">
                    <Filter className="w-5 h-5 text-red-200" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-xs font-bold text-slate-600 mr-1">تاريخ البداية</label>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)} 
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 w-full transition-all"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-xs font-bold text-slate-600 mr-1">تاريخ النهاية</label>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)} 
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 w-full transition-all"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-xs font-bold text-slate-600 mr-1">الغرفة</label>
                        <select 
                            value={roomFilter} 
                            onChange={e => setRoomFilter(e.target.value)} 
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 w-full transition-all outline-none"
                        >
                            <option value="all">كل الغرف (متضمن الكافيه)</option>
                            {availableRooms.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>
                
                <button 
                    onClick={fetchAnalyticsData}
                    disabled={isLoading}
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 active:scale-95 transition-all w-full lg:w-auto whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            جاري التحديث...
                        </>
                    ) : (
                        'تحديث البيانات'
                    )}
                </button>
            </div>

            {/* Interactive Client Filters Indicators */}
            {(interactiveRoom || interactiveDate) && (
                <div className="flex flex-wrap items-center gap-3 mb-6 bg-indigo-50 border border-indigo-100 p-3 rounded-2xl animate-fade-in-up">
                    <span className="text-xs font-bold text-indigo-800 flex items-center gap-1">
                        <MousePointerClick className="w-4 h-4" />
                        الرسوم البيانية مفلترة حالياً حسب:
                    </span>
                    {interactiveDate && (
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 text-sm font-bold text-indigo-700 shadow-sm">
                            <span>يوم: {new Date(interactiveDate).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
                            <button onClick={() => setInteractiveDate(null)} className="hover:text-red-500 transition-colors">
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    {interactiveRoom && (
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 text-sm font-bold text-indigo-700 shadow-sm">
                            <span>غرفة: {interactiveRoom}</span>
                            <button onClick={() => setInteractiveRoom(null)} className="hover:text-red-500 transition-colors">
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <button 
                        onClick={() => { setInteractiveDate(null); setInteractiveRoom(null); }}
                        className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mr-auto underline"
                    >
                        مسح الفلاتر التفاعلية
                    </button>
                </div>
            )}

            {/* Key Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <MetricCard 
                    title="إجمالي الإيرادات" 
                    value={`${totalRevenue.toLocaleString()} ج.م`} 
                    subtitle="للفترة / الفلتر الحالي"
                    icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
                    bgClass="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200"
                />
                <MetricCard 
                    title="إيرادات البلايستيشن" 
                    value={`${psRevenueTotal.toLocaleString()} ج.م`} 
                    subtitle={`${((psRevenueTotal / (totalRevenue || 1)) * 100).toFixed(1)}% من الإجمالي`}
                    icon={<Gamepad2 className="w-6 h-6 text-indigo-600" />}
                    bgClass="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200"
                />
                <MetricCard 
                    title="إيرادات الكافيه" 
                    value={`${cafeRevenueTotal.toLocaleString()} ج.م`} 
                    subtitle={`${((cafeRevenueTotal / (totalRevenue || 1)) * 100).toFixed(1)}% من الإجمالي`}
                    icon={<Coffee className="w-6 h-6 text-amber-600" />}
                    bgClass="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200"
                />
                <MetricCard 
                    title="إجمالي الحجوزات (PS)" 
                    value={totalBookings.toString()} 
                    subtitle="حجوزات مكتملة ومؤكدة"
                    icon={<Users className="w-6 h-6 text-blue-600" />}
                    bgClass="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Revenue Split Chart (Stacked) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative group">
                    <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-md">
                        <MousePointerClick className="w-3 h-3" /> اضغط للفلترة باليوم
                    </div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-indigo-500" />
                            مقارنة الإيرادات (اضغط على العمود للفلترة)
                        </h3>
                    </div>
                    <div className="h-[300px] w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={dailyRevenue} 
                                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} 
                                    tickMargin={12}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                                <Bar 
                                    dataKey="psRevenue" 
                                    name="البلايستيشن" 
                                    stackId="a" 
                                    fill="#6366f1" 
                                    radius={[0, 0, 4, 4]} 
                                    maxBarSize={40} 
                                    className="cursor-pointer hover:opacity-80 transition-opacity" 
                                    onClick={(data: any) => {
                                        const date = data?.rawDate || data?.payload?.rawDate;
                                        if (date) setInteractiveDate(date);
                                    }}
                                />
                                <Bar 
                                    dataKey="cafeRevenue" 
                                    name="الكافيه" 
                                    stackId="a" 
                                    fill="#f59e0b" 
                                    radius={[4, 4, 0, 0]} 
                                    maxBarSize={40} 
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={(data: any) => {
                                        const date = data?.rawDate || data?.payload?.rawDate;
                                        if (date) setInteractiveDate(date);
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Peak Hours Area Chart */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-rose-500" />
                            ساعات الذروة للحجوزات
                        </h3>
                    </div>
                    <div className="h-[300px] w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="hour" 
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                                    tickMargin={12}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'right' }}
                                    formatter={(value: number) => [`${value} حجز`, 'كثافة الحجوزات']}
                                    labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '8px' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Room Popularity & Top Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(!interactiveRoom && roomFilter === 'all') && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative group">
                        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-md">
                            <MousePointerClick className="w-3 h-3" /> اضغط للفلترة بالغرفة
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Gamepad2 className="w-4 h-4 text-emerald-500" />
                            الغرف الأكثر تحقيقاً للإيرادات (اضغط على الغرفة للفلترة)
                        </h3>
                        <div className="h-[300px] w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={roomStats} 
                                    layout="vertical" 
                                    margin={{ top: 0, right: 10, left: 30, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#475569', fontSize: 12, fontWeight: 'bold' }} 
                                        width={100}
                                    />
                                    <RechartsTooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'right' }}
                                        formatter={(value: number, name: string) => [
                                            name === 'revenue' ? `${value.toLocaleString()} ج.م` : value,
                                            name === 'revenue' ? 'الإيرادات' : 'عدد الحجوزات'
                                        ]}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                                    <Bar 
                                        dataKey="revenue" 
                                        name="الإيرادات" 
                                        radius={[0, 4, 4, 0]} 
                                        barSize={20}
                                        className="cursor-pointer"
                                        onClick={(data: any) => {
                                            const rName = data?.name || data?.payload?.name;
                                            if (rName) setInteractiveRoom(rName);
                                        }}
                                    >
                                        {roomStats.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill="#10b981" 
                                                className="hover:opacity-80 transition-opacity cursor-pointer" 
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Top Customers Leaderboard */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-amber-900 mb-6 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        أفضل العملاء (VIP) للفترة المحددة
                    </h3>
                    
                    {topCustomers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[250px] text-amber-700/50">
                            <Users className="w-12 h-12 mb-3 opacity-50" />
                            <p className="font-bold">لا يوجد بيانات كافية للعملاء</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {topCustomers.map((customer, index) => (
                                <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0 shadow-sm ${
                                        index === 0 ? 'bg-amber-400 text-amber-900' :
                                        index === 1 ? 'bg-slate-300 text-slate-800' :
                                        'bg-orange-300 text-orange-900'
                                    }`}>
                                        #{index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-slate-800">{customer.name}</h4>
                                        {customer.phone && <p className="text-xs font-bold text-slate-500">{customer.phone}</p>}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-emerald-600 text-lg">{customer.revenue.toLocaleString()} <span className="text-[10px]">ج.م</span></p>
                                        <p className="text-[10px] font-bold text-slate-400">{customer.visits} زيارات/طلبات</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, subtitle, icon, bgClass }: { title: string, value: string, subtitle: string, icon: React.ReactNode, bgClass: string }) {
    return (
        <div className={`p-5 rounded-3xl border ${bgClass} shadow-sm relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}>
            {/* Background Decorative element */}
            <div className="absolute -right-4 -top-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                {icon}
            </div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <h4 className="text-xs sm:text-sm font-bold text-slate-700 opacity-90">{title}</h4>
                <div className="p-2 bg-white/60 backdrop-blur-sm rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-slate-700 transition-colors group-hover:bg-white/90">
                    {icon}
                </div>
            </div>
            <div className="relative z-10">
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 tracking-tight">{value}</p>
                <p className="text-[10px] sm:text-xs font-bold text-slate-600 opacity-80">{subtitle}</p>
            </div>
        </div>
    );
}
