import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { 
    TrendingUp, 
    CalendarDays, 
    Gamepad2, 
    Activity,
    CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

interface DailyStats {
    date: string;
    revenue: number;
    count: number;
    rawDate: string;
}

interface StatusStats {
    name: string;
    value: number;
    color: string;
}

const STATUS_COLORS: Record<string, string> = {
    'confirmed': '#10b981', // emerald
    'completed': '#64748b', // slate
    'pending': '#f59e0b',   // amber
    'cancelled': '#ef4444'  // rose
};

const STATUS_LABELS: Record<string, string> = {
    'confirmed': 'مؤكد',
    'completed': 'مكتمل',
    'pending': 'معلق',
    'cancelled': 'ملغي'
};

export default function AnalyticsTab() {
    const [isLoading, setIsLoading] = useState(true);
    const [dailyData, setDailyData] = useState<DailyStats[]>([]);
    const [statusData, setStatusData] = useState<StatusStats[]>([]);
    
    // Key Metrics
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [totalBookings, setTotalBookings] = useState(0);
    const [todayBookings, setTodayBookings] = useState(0);

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                setIsLoading(true);
                
                // Get date 7 days ago
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const startDateStr = sevenDaysAgo.toISOString().split('T')[0];

                const { data, error } = await supabase
                    .from('ps_bookings')
                    .select('booking_date, status, total_amount')
                    .gte('booking_date', startDateStr);

                if (error) throw error;

                if (data) {
                    // Aggregate Daily Revenue
                    const dailyMap = new Map<string, { revenue: number, count: number }>();
                    // Aggregate Statuses
                    const statusMap = new Map<string, number>();
                    
                    let totalRev = 0;
                    let todayRev = 0;
                    let totalBook = 0;
                    let todayBook = 0;

                    // Get today's date string in Egypt timezone
                    const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });

                    data.forEach(booking => {
                        const date = booking.booking_date;
                        const status = booking.status;
                        const amount = Number(booking.total_amount) || 0;

                        // Totals
                        totalBook++;
                        if (status === 'confirmed' || status === 'completed') {
                            totalRev += amount;
                        }

                        if (date === todayDate) {
                            todayBook++;
                            if (status === 'confirmed' || status === 'completed') {
                                todayRev += amount;
                            }
                        }

                        // Daily Stats (Only count confirmed/completed for revenue)
                        if (!dailyMap.has(date)) {
                            dailyMap.set(date, { revenue: 0, count: 0 });
                        }
                        const dayStats = dailyMap.get(date)!;
                        dayStats.count += 1;
                        if (status === 'confirmed' || status === 'completed') {
                            dayStats.revenue += amount;
                        }

                        // Status Stats
                        statusMap.set(status, (statusMap.get(status) || 0) + 1);
                    });

                    // Format Daily Data for Recharts
                    const formattedDailyData = Array.from(dailyMap.entries())
                        .map(([date, stats]) => ({
                            date: new Date(date).toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric' }),
                            revenue: stats.revenue,
                            count: stats.count,
                            rawDate: date
                        }))
                        .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

                    // Format Status Data
                    const formattedStatusData = Array.from(statusMap.entries()).map(([status, count]) => ({
                        name: STATUS_LABELS[status] || status,
                        value: count,
                        color: STATUS_COLORS[status] || '#cbd5e1'
                    }));

                    setDailyData(formattedDailyData);
                    setStatusData(formattedStatusData);
                    setTotalRevenue(totalRev);
                    setTodayRevenue(todayRev);
                    setTotalBookings(totalBook);
                    setTodayBookings(todayBook);
                }
            } catch (err: any) {
                console.error("Error fetching analytics:", err);
                toast.error("حدث خطأ أثناء جلب بيانات التحليلات");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalyticsData();
    }, []);

    if (isLoading) {
        return (
            <div className="w-full flex justify-center items-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-bold text-sm">جاري تحليل البيانات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto py-6 px-2 sm:px-4 fade-in">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="w-6 h-6 text-red-600" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">التحليلات والإحصائيات</h2>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <MetricCard 
                    title="إجمالي الإيرادات (7 أيام)" 
                    value={`${totalRevenue.toLocaleString()} ج.م`} 
                    icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
                    bgClass="bg-emerald-50 border-emerald-200"
                />
                <MetricCard 
                    title="إيرادات اليوم" 
                    value={`${todayRevenue.toLocaleString()} ج.م`} 
                    icon={<CreditCard className="w-6 h-6 text-blue-600" />}
                    bgClass="bg-blue-50 border-blue-200"
                />
                <MetricCard 
                    title="إجمالي الحجوزات (7 أيام)" 
                    value={totalBookings.toString()} 
                    icon={<Gamepad2 className="w-6 h-6 text-indigo-600" />}
                    bgClass="bg-indigo-50 border-indigo-200"
                />
                <MetricCard 
                    title="حجوزات اليوم" 
                    value={todayBookings.toString()} 
                    icon={<CalendarDays className="w-6 h-6 text-red-600" />}
                    bgClass="bg-red-50 border-red-200"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
                    <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        الإيرادات خلال آخر 7 أيام
                    </h3>
                    <div className="h-[300px] w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fill: '#64748b', fontSize: 12 }} 
                                    tickMargin={15}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tick={{ fill: '#64748b', fontSize: 12 }} 
                                    tickFormatter={(value) => `${value}`}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <RechartsTooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'right' }}
                                    formatter={(value: number) => [`${value} ج.م`, 'الإيرادات']}
                                    labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '8px' }}
                                />
                                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Breakdown Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
                    <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-600" />
                        حالات الحجوزات
                    </h3>
                    <div className="h-[250px] w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'right' }}
                                    formatter={(value: number) => [value, 'عدد الحجوزات']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    
                    {/* Custom Legend */}
                    <div className="flex flex-wrap justify-center gap-4 mt-6">
                        {statusData.map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs font-bold text-slate-700">{entry.name} ({entry.value})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, bgClass }: { title: string, value: string, icon: React.ReactNode, bgClass: string }) {
    return (
        <div className={`p-5 rounded-2xl border ${bgClass} shadow-xs`}>
            <div className="flex justify-between items-start mb-4">
                <h4 className="text-sm font-bold text-slate-700 opacity-80">{title}</h4>
                <div className="p-2 bg-white rounded-xl shadow-xs">
                    {icon}
                </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{value}</p>
        </div>
    );
}
