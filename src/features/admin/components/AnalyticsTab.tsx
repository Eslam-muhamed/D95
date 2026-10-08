import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
    TrendingUp, 
    CalendarDays, 
    Gamepad2, 
    Activity,
    CreditCard,
    Coffee,
    Clock,
    Users
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

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function AnalyticsTab() {
    const [isLoading, setIsLoading] = useState(true);
    const [periodDays, setPeriodDays] = useState<number>(30); // Default to 30 days
    
    const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
    const [roomStats, setRoomStats] = useState<RoomPopularity[]>([]);
    const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
    
    // Key Metrics
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [psRevenueTotal, setPsRevenueTotal] = useState(0);
    const [cafeRevenueTotal, setCafeRevenueTotal] = useState(0);
    const [totalBookings, setTotalBookings] = useState(0);

    const fetchAnalyticsData = async () => {
        try {
            setIsLoading(true);
            
            // Calculate start date
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - periodDays);
            const startDateStr = startDate.toISOString().split('T')[0];

            // Fetch Bookings
            const { data: bookingsData, error: bookingsError } = await supabase
                .from('ps_bookings')
                .select('booking_date, start_datetime, status, total_amount, room_name')
                .gte('booking_date', startDateStr);

            if (bookingsError) throw bookingsError;

            // Fetch Orders (Cafe)
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('created_at, status, total_amount')
                .gte('created_at', startDateStr);

            if (ordersError) throw ordersError;

            // --- DATA PROCESSING ---
            const dailyMap = new Map<string, { ps: number, cafe: number }>();
            const roomMap = new Map<string, { count: number, revenue: number }>();
            const hoursMap = new Map<number, number>(); // 0-23

            let tRev = 0;
            let psRev = 0;
            let cafeRev = 0;
            let tBookings = 0;

            // Process Bookings
            (bookingsData || []).forEach(booking => {
                if (booking.status !== 'confirmed' && booking.status !== 'completed') return;

                const date = booking.booking_date;
                const amount = Number(booking.total_amount) || 0;
                
                tBookings++;
                psRev += amount;
                tRev += amount;

                // Daily Revenue
                if (!dailyMap.has(date)) dailyMap.set(date, { ps: 0, cafe: 0 });
                dailyMap.get(date)!.ps += amount;

                // Room Popularity
                const rName = booking.room_name || 'غرفة غير معروفة';
                if (!roomMap.has(rName)) roomMap.set(rName, { count: 0, revenue: 0 });
                roomMap.get(rName)!.count += 1;
                roomMap.get(rName)!.revenue += amount;

                // Peak Hours (based on start time)
                if (booking.start_datetime) {
                    const hour = new Date(booking.start_datetime).getHours();
                    hoursMap.set(hour, (hoursMap.get(hour) || 0) + 1);
                }
            });

            // Process Orders
            (ordersData || []).forEach(order => {
                if (order.status !== 'completed' && order.status !== 'delivered' && order.status !== 'paid') return;
                
                const date = order.created_at.split('T')[0];
                const amount = Number(order.total_amount) || 0;

                cafeRev += amount;
                tRev += amount;

                if (!dailyMap.has(date)) dailyMap.set(date, { ps: 0, cafe: 0 });
                dailyMap.get(date)!.cafe += amount;
            });

            // Format Daily Revenue
            const formattedDaily = Array.from(dailyMap.entries())
                .map(([date, stats]) => ({
                    date: new Date(date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
                    psRevenue: stats.ps,
                    cafeRevenue: stats.cafe,
                    totalRevenue: stats.ps + stats.cafe,
                    rawDate: date
                }))
                .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

            // Format Room Popularity
            const formattedRooms = Array.from(roomMap.entries())
                .map(([name, stats]) => ({
                    name,
                    count: stats.count,
                    revenue: stats.revenue
                }))
                .sort((a, b) => b.revenue - a.revenue); // sort by revenue

            // Format Peak Hours (0-23)
            const formattedHours: PeakHour[] = [];
            for (let i = 0; i < 24; i++) {
                // format hour 00:00 to 23:00
                const hourStr = `${i.toString().padStart(2, '0')}:00`;
                formattedHours.push({
                    hour: hourStr,
                    count: hoursMap.get(i) || 0
                });
            }

            setDailyRevenue(formattedDaily);
            setRoomStats(formattedRooms);
            setPeakHours(formattedHours);

            setTotalRevenue(tRev);
            setPsRevenueTotal(psRev);
            setCafeRevenueTotal(cafeRev);
            setTotalBookings(tBookings);

        } catch (err: any) {
            console.error("Error fetching analytics:", err);
            toast.error("حدث خطأ أثناء جلب بيانات التحليلات");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalyticsData();
    }, [periodDays]);

    if (isLoading) {
        return (
            <div className="w-full flex justify-center items-center py-32">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin shadow-lg" />
                    <p className="text-slate-600 font-bold text-sm">جاري تجميع البيانات وتحليلها...</p>
                </div>
            </div>
        );
    }

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">تحليلات الأعمال (BI)</h2>
                        <p className="text-xs font-semibold text-slate-500 mt-1">تتبع أداء المكان واتخذ قرارات مبنية على البيانات</p>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="flex bg-slate-200/70 p-1 rounded-xl shadow-inner w-full sm:w-auto">
                    {[7, 14, 30].map(days => (
                        <button
                            key={days}
                            onClick={() => setPeriodDays(days)}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                periodDays === days 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {days} أيام
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <MetricCard 
                    title="إجمالي الإيرادات" 
                    value={`${totalRevenue.toLocaleString()} ج.م`} 
                    subtitle={`خلال ${periodDays} يوماً`}
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
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-indigo-500" />
                            مقارنة الإيرادات (بلايستيشن vs كافيه)
                        </h3>
                    </div>
                    <div className="h-[300px] w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
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
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                                <Bar dataKey="psRevenue" name="البلايستيشن" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} maxBarSize={40} />
                                <Bar dataKey="cafeRevenue" name="الكافيه" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
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

            {/* Room Popularity */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-emerald-500" />
                    الغرف الأكثر تحقيقاً للإيرادات
                </h3>
                <div className="h-[300px] w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={roomStats} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
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
                            <Bar dataKey="revenue" name="الإيرادات" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                            {/* <Bar dataKey="count" name="عدد الحجوزات" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} /> */}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}

function MetricCard({ title, value, subtitle, icon, bgClass }: { title: string, value: string, subtitle: string, icon: React.ReactNode, bgClass: string }) {
    return (
        <div className={`p-5 rounded-3xl border ${bgClass} shadow-sm relative overflow-hidden group`}>
            {/* Background Decorative element */}
            <div className="absolute -right-4 -top-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                {icon}
            </div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <h4 className="text-xs sm:text-sm font-bold text-slate-700 opacity-90">{title}</h4>
                <div className="p-2 bg-white/60 backdrop-blur-sm rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-slate-700">
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
