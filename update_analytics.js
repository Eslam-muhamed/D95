const fs = require('fs');
const file = 'src/features/admin/components/AnalyticsTab.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace periodDays with filter state
content = content.replace(
    'const [periodDays, setPeriodDays] = useState<number>(30); // Default to 30 days',
    `const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
    const [roomFilter, setRoomFilter] = useState<string>('all');
    const [availableRooms, setAvailableRooms] = useState<string[]>([]);`
);

// Update fetchAnalyticsData
const fetchReplacement = `const fetchAnalyticsData = async () => {
        try {
            setIsLoading(true);
            
            // Fetch Bookings
            let bookingsQuery = supabase
                .from('ps_bookings')
                .select('booking_date, start_datetime, status, total_amount, room_name')
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
                    .select('created_at, status, total_amount')
                    .gte('created_at', startDate)
                    .lte('created_at', endDate + 'T23:59:59');

                if (ordersError) throw ordersError;
                ordersData = data || [];
            }

            // --- DATA PROCESSING ---
            const dailyMap = new Map<string, { ps: number, cafe: number }>();
            const roomMap = new Map<string, { count: number, revenue: number }>();
            const hoursMap = new Map<number, number>(); // 0-23
            const roomsSet = new Set<string>();

            let tRev = 0;
            let psRev = 0;
            let cafeRev = 0;
            let tBookings = 0;

            // Process Bookings
            (bookingsData || []).forEach(booking => {
                if (booking.status !== 'confirmed' && booking.status !== 'completed') return;

                const date = booking.booking_date;
                const amount = Number(booking.total_amount) || 0;
                const rName = booking.room_name || 'غرفة غير معروفة';
                roomsSet.add(rName);
                
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

                // Peak Hours (based on start time)
                if (booking.start_datetime) {
                    const hour = new Date(booking.start_datetime).getHours();
                    hoursMap.set(hour, (hoursMap.get(hour) || 0) + 1);
                }
            });

            // Process Orders
            ordersData.forEach(order => {
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
                .sort((a, b) => b.revenue - a.revenue);

            // Format Peak Hours (0-23)
            const formattedHours: PeakHour[] = [];
            for (let i = 0; i < 24; i++) {
                const hourStr = \`\${i.toString().padStart(2, '0')}:00\`;
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
            
            // Only update available rooms if we are looking at 'all', so we don't lose the list when filtering
            if (roomFilter === 'all' && roomsSet.size > 0) {
                setAvailableRooms(Array.from(roomsSet));
            }

        } catch (err: any) {
            console.error("Error fetching analytics:", err);
            toast.error("حدث خطأ أثناء جلب بيانات التحليلات");
        } finally {
            setIsLoading(false);
        }
    };`;

content = content.replace(/const fetchAnalyticsData = async \(\) => \{[\s\S]*?\}\s*catch[\s\S]*?finally\s*\{[\s\S]*?\}\s*\};\s*useEffect\(\(\) => \{[\s\S]*?fetchAnalyticsData\(\);\s*\}, \[periodDays\]\);/g, fetchReplacement + "\n\n    useEffect(() => { fetchAnalyticsData(); }, []);");

// Update JSX
const filterUI = `                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-end gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 w-full">
                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                        <label className="text-xs font-bold text-slate-500">من تاريخ</label>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)} 
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                        <label className="text-xs font-bold text-slate-500">إلى تاريخ</label>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)} 
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                        <label className="text-xs font-bold text-slate-500">الغرفة</label>
                        <select 
                            value={roomFilter} 
                            onChange={e => setRoomFilter(e.target.value)} 
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 w-full"
                        >
                            <option value="all">كل الغرف (وطلبات الكافيه)</option>
                            {availableRooms.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <button 
                        onClick={fetchAnalyticsData} 
                        className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors w-full sm:w-auto"
                    >
                        تطبيق الفلاتر
                    </button>
                </div>`;

content = content.replace(
    /\{\/\* Period Selector \*\/\}.*?(?=\{\/\* Key Metrics Dashboard \*\/)/s,
    filterUI + '\n            </div>\n\n            '
);

content = content.replace('subtitle={`خلال ${periodDays} يوماً`}', 'subtitle="خلال الفترة المحددة"');

fs.writeFileSync(file, content);
