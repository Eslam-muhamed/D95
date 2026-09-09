import { useState, useEffect, useMemo, useRef } from 'react';
import {
    LayoutGrid,
    Gamepad2,
    CircleDot,
    Clock,
    ShoppingBag,
    Pause,
    Play,
    ArrowLeftRight,
    RefreshCw,
    Trash2,
    Plus,
    X,
    Search,
    Users,
    Receipt,
    Check,
    AlertCircle,
    Volume2,
    VolumeX,
    User,
    Sparkles,
    Edit3,
} from 'lucide-react';
import { toast } from 'sonner';

import {
    GamingStation,
    StationSession,
    SessionOrderItem,
    fetchGamingStations,
    fetchActiveSessions,
    startStationSession,
    pauseStationSession,
    resumeStationSession,
    updateSessionNotes,
    toggleSessionMulti,
    addOrderToSession,
    transferStationSession,
    completeStationSession,
    createGamingStation,
    deleteGamingStation,
} from '@/services/stationsService';
import { fetchProducts } from '@/services/menuService';
import type { DBProduct } from '@/types/database';
import { playPs5SelectSound, playPs5NavigateSound, playPs5StartupSound } from '@/lib/sound';

export default function LiveStationsTab() {
    const [stations, setStations] = useState<GamingStation[]>([]);
    const [sessions, setSessions] = useState<Record<string, StationSession>>({});
    const [products, setProducts] = useState<DBProduct[]>([]);
    const [loading, setLoading] = useState(true);

    // Active Category Filter: 'all' | 'console' | 'recreation'
    const [activeFilter, setActiveFilter] = useState<'all' | 'console' | 'recreation'>('all');

    // Sound toggle state (PlayMasr Sound)
    const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
        return localStorage.getItem('d95_pos_sound') !== 'false';
    });

    // Modals state
    const [startModalStation, setStartModalStation] = useState<GamingStation | null>(null);
    const [orderModalStation, setOrderModalStation] = useState<GamingStation | null>(null);
    const [transferModalStation, setTransferModalStation] = useState<GamingStation | null>(null);
    const [payModalStation, setPayModalStation] = useState<GamingStation | null>(null);
    const [timeModalStation, setTimeModalStation] = useState<GamingStation | null>(null);
    const [addStationModalOpen, setAddStationModalOpen] = useState(false);

    // Start Session Modal form state
    const [startCustomerName, setStartCustomerName] = useState('');
    const [startPricingMode, setStartPricingMode] = useState<'hourly' | 'match'>('hourly');
    const [startTimeSystem, setStartTimeSystem] = useState<'open' | 'fixed'>('open');
    const [startTargetMinutes, setStartTargetMinutes] = useState<number>(60);
    const [startIsMulti, setStartIsMulti] = useState<boolean>(false);

    // Order Modal state
    const [orderSearch, setOrderSearch] = useState('');
    const [orderSelectedCategory, setOrderSelectedCategory] = useState<string>('all');
    const [tempOrderCart, setTempOrderCart] = useState<{ product: DBProduct; qty: number }[]>([]);

    // Pay Modal state
    const [payDiscount, setPayDiscount] = useState<number>(0);
    const [payPaymentMethod, setPayPaymentMethod] = useState<'cash' | 'instapay' | 'wallet'>('cash');

    // Add Station Modal state
    const [newStationName, setNewStationName] = useState('');
    const [newStationCategory, setNewStationCategory] = useState<'console' | 'recreation'>('console');
    const [newStationDevice, setNewStationDevice] = useState('PS5');
    const [newStationRate, setNewStationRate] = useState(50);
    const [newStationMultiRate, setNewStationMultiRate] = useState(70);

    // Real-time ticking state
    const [now, setNow] = useState<number>(Date.now());

    const playSound = (type: 'select' | 'nav' | 'startup') => {
        if (!soundEnabled) return;
        if (type === 'select') playPs5SelectSound();
        if (type === 'nav') playPs5NavigateSound();
        if (type === 'startup') playPs5StartupSound();
    };

    const toggleSound = () => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        localStorage.setItem('d95_pos_sound', next ? 'true' : 'false');
        toast.info(next ? 'تم تفعيل مؤثرات الصوت 🔊' : 'تم كتم الصوت 🔇');
    };

    // Load initial data
    const loadAll = async () => {
        setLoading(true);
        try {
            const [stList, sessMap, prodList] = await Promise.all([
                fetchGamingStations(),
                fetchActiveSessions(),
                fetchProducts('all'),
            ]);
            setStations(stList);
            setSessions(sessMap);
            setProducts(prodList);
        } catch (e) {
            console.error('Failed to load live stations:', e);
            toast.error('تعذر جلب بيانات الأجهزة والجلسات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    // 1-second live ticker for stopwatches and countdowns
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Helper: calculate live seconds elapsed for a session
    const getSessionElapsedSeconds = (session: StationSession): number => {
        if (session.status === 'paused') {
            return session.elapsed_seconds;
        }
        const startMs = new Date(session.start_time).getTime();
        const currentDiffSeconds = Math.max(0, Math.floor((now - startMs) / 1000));
        return session.elapsed_seconds + currentDiffSeconds;
    };

    // Helper: format seconds to HH:MM:SS
    const formatDuration = (totalSecs: number): string => {
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // Helper: calculate live cost based on seconds and rate
    const calculateSessionTimeCost = (session: StationSession, station: GamingStation): number => {
        if (session.pricing_mode === 'match') {
            return station.rate_per_match || 0;
        }
        const secs = getSessionElapsedSeconds(session);
        const rate = session.is_multi ? station.multi_rate_per_hour : session.hourly_rate;
        const hours = secs / 3600;
        return Math.round(hours * rate * 100) / 100;
    };

    // Filter counts
    const filterCounts = useMemo(() => {
        const all = stations.length;
        const consoles = stations.filter((s) => s.category === 'console').length;
        const recreation = stations.filter((s) => s.category === 'recreation').length;
        return { all, consoles, recreation };
    }, [stations]);

    // Filtered stations
    const filteredStations = useMemo(() => {
        if (activeFilter === 'all') return stations;
        return stations.filter((s) => s.category === activeFilter);
    }, [stations, activeFilter]);

    // Group stations by category
    const consoleStations = useMemo(() => {
        return filteredStations.filter((s) => s.category === 'console');
    }, [filteredStations]);

    const recreationStations = useMemo(() => {
        return filteredStations.filter((s) => s.category === 'recreation');
    }, [filteredStations]);

    // Handler: Open Start Session Modal
    const handleOpenStartModal = (station: GamingStation) => {
        playSound('select');
        setStartModalStation(station);
        setStartCustomerName('');
        setStartPricingMode('hourly');
        setStartTimeSystem('open');
        setStartTargetMinutes(60);
        setStartIsMulti(false);
    };

    // Handler: Confirm Start Session
    const handleConfirmStart = async () => {
        if (!startModalStation) return;
        playSound('startup');
        const station = startModalStation;

        const rate = startIsMulti ? station.multi_rate_per_hour : station.rate_per_hour;

        try {
            const newSession = await startStationSession({
                station_id: station.id,
                customer_name: startCustomerName.trim() || 'عميل عام',
                pricing_mode: startPricingMode,
                time_system: startTimeSystem,
                target_minutes: startTimeSystem === 'fixed' ? startTargetMinutes : undefined,
                is_multi: startIsMulti,
                started_by: 'المدير',
                hourly_rate: rate,
            });

            setSessions((prev) => ({ ...prev, [station.id]: newSession }));
            setStations((prev) =>
                prev.map((s) => (s.id === station.id ? { ...s, status: 'busy' } : s))
            );

            toast.success(`🎮 تم بدء جلسة ${station.name} بنجاح!`);
            setStartModalStation(null);
        } catch (e) {
            console.error('Failed to start session:', e);
            toast.error('حدث خطأ أثناء بدء الجلسة');
        }
    };

    // Handler: Toggle Pause / Resume
    const handleTogglePause = async (station: GamingStation) => {
        const session = sessions[station.id];
        if (!session) return;
        playSound('select');

        if (session.status === 'active') {
            const elapsed = getSessionElapsedSeconds(session);
            await pauseStationSession(session.id, station.id, elapsed);
            setSessions((prev) => ({
                ...prev,
                [station.id]: {
                    ...session,
                    status: 'paused',
                    elapsed_seconds: elapsed,
                    pause_time: new Date().toISOString(),
                },
            }));
            setStations((prev) =>
                prev.map((s) => (s.id === station.id ? { ...s, status: 'paused' } : s))
            );
            toast.info(`⏸ تم إيقاف جلسة ${station.name} مؤقتاً`);
        } else {
            await resumeStationSession(session.id, station.id);
            setSessions((prev) => ({
                ...prev,
                [station.id]: {
                    ...session,
                    status: 'active',
                    pause_time: null,
                    start_time: new Date().toISOString(),
                },
            }));
            setStations((prev) =>
                prev.map((s) => (s.id === station.id ? { ...s, status: 'busy' } : s))
            );
            toast.success(`▶ تم استئناف جلسة ${station.name}`);
        }
    };

    // Handler: Toggle Multi / Single Mode
    const handleToggleMulti = async (station: GamingStation) => {
        const session = sessions[station.id];
        if (!session) return;
        playSound('nav');

        const nextMulti = !session.is_multi;
        const newRate = nextMulti ? station.multi_rate_per_hour : station.rate_per_hour;

        await toggleSessionMulti(session.id, nextMulti, newRate);
        setSessions((prev) => ({
            ...prev,
            [station.id]: {
                ...session,
                is_multi: nextMulti,
                hourly_rate: newRate,
            },
        }));

        toast.success(nextMulti ? 'تم تحويل الجلسة إلى نظام MULTI 🎮' : 'تم تحويل الجلسة إلى فردي SINGLE');
    };

    // Handler: Open Order Modal
    const handleOpenOrderModal = (station: GamingStation) => {
        playSound('select');
        setOrderModalStation(station);
        setTempOrderCart([]);
        setOrderSearch('');
    };

    // Handler: Add product to temp cart
    const handleAddProductToCart = (prod: DBProduct) => {
        playSound('nav');
        setTempOrderCart((prev) => {
            const existing = prev.find((x) => x.product.id === prod.id);
            if (existing) {
                return prev.map((x) => (x.product.id === prod.id ? { ...x, qty: x.qty + 1 } : x));
            }
            return [...prev, { product: prod, qty: 1 }];
        });
    };

    const handleRemoveProductFromCart = (prodId: string) => {
        playSound('nav');
        setTempOrderCart((prev) => {
            const existing = prev.find((x) => x.product.id === prodId);
            if (existing && existing.qty > 1) {
                return prev.map((x) => (x.product.id === prodId ? { ...x, qty: x.qty - 1 } : x));
            }
            return prev.filter((x) => x.product.id !== prodId);
        });
    };

    // Handler: Confirm Adding Orders to Session
    const handleConfirmOrder = async () => {
        if (!orderModalStation) return;
        const session = sessions[orderModalStation.id];
        if (!session) return;

        if (tempOrderCart.length === 0) {
            toast.error('يرجى اختيار منتج واحد على الأقل');
            return;
        }

        playSound('select');
        let currentOrders = [...(session.orders || [])];

        for (const item of tempOrderCart) {
            const newOrder: SessionOrderItem = {
                id: 'ord_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                product_id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                quantity: item.qty,
                added_at: new Date().toISOString(),
            };
            const res = await addOrderToSession(session.id, currentOrders, newOrder);
            currentOrders = res.orders;
        }

        const ordersTotal = currentOrders.reduce((sum, o) => sum + o.price * o.quantity, 0);
        setSessions((prev) => ({
            ...prev,
            [orderModalStation.id]: {
                ...session,
                orders: currentOrders,
                orders_total: ordersTotal,
            },
        }));

        toast.success(`تمت إضافة ${tempOrderCart.length} طلبات إلى حساب ${orderModalStation.name}! 🥤`);
        setOrderModalStation(null);
    };

    // Handler: Open Transfer Modal
    const handleOpenTransferModal = (station: GamingStation) => {
        playSound('select');
        setTransferModalStation(station);
    };

    // Handler: Confirm Transfer
    const handleConfirmTransfer = async (targetStationId: string) => {
        if (!transferModalStation) return;
        const currentId = transferModalStation.id;
        const session = sessions[currentId];
        if (!session) return;

        const targetStation = stations.find((s) => s.id === targetStationId);
        if (!targetStation) return;

        playSound('select');
        try {
            await transferStationSession(session.id, currentId, targetStationId);

            const updatedSession = { ...session, station_id: targetStationId };
            setSessions((prev) => {
                const next = { ...prev };
                delete next[currentId];
                next[targetStationId] = updatedSession;
                return next;
            });

            setStations((prev) =>
                prev.map((s) => {
                    if (s.id === currentId) return { ...s, status: 'available' };
                    if (s.id === targetStationId) return { ...s, status: 'busy' };
                    return s;
                })
            );

            toast.success(`تم نقل الجلسة بنجاح إلى ${targetStation.name} 🔁`);
            setTransferModalStation(null);
        } catch (e) {
            console.error('Transfer failed:', e);
            toast.error('تعذر نقل الجلسة');
        }
    };

    // Handler: Open Pay / Settle Modal
    const handleOpenPayModal = (station: GamingStation) => {
        playSound('select');
        setPayModalStation(station);
        setPayDiscount(0);
        setPayPaymentMethod('cash');
    };

    // Handler: Confirm Payment & Complete Session
    const handleConfirmPayment = async () => {
        if (!payModalStation) return;
        const session = sessions[payModalStation.id];
        if (!session) return;

        playSound('startup');
        const elapsedSecs = getSessionElapsedSeconds(session);
        const timeCost = calculateSessionTimeCost(session, payModalStation);
        const ordersTotal = (session.orders || []).reduce((sum, o) => sum + o.price * o.quantity, 0);
        const grandTotal = Math.max(0, timeCost + ordersTotal - payDiscount);

        try {
            await completeStationSession({
                sessionId: session.id,
                stationId: payModalStation.id,
                elapsedSeconds: elapsedSecs,
                timeCost,
                ordersTotal,
                discountAmount: payDiscount,
                grandTotal,
                paymentMethod: payPaymentMethod,
            });

            // Free the station
            setSessions((prev) => {
                const next = { ...prev };
                delete next[payModalStation.id];
                return next;
            });

            setStations((prev) =>
                prev.map((s) => (s.id === payModalStation.id ? { ...s, status: 'available' } : s))
            );

            toast.success(`تم إنهاء حساب ${payModalStation.name} ودفع ${grandTotal} ج.م بنجاح! 🧾`);
            setPayModalStation(null);
        } catch (e) {
            console.error('Payment failed:', e);
            toast.error('تعذر إنهاء الدفع');
        }
    };

    // Handler: Delete Station
    const handleDeleteStation = async (station: GamingStation) => {
        if (sessions[station.id]) {
            toast.error('لا يمكن حذف جهاز قيد التشغيل حالياً! أنهِ الجلسة أولاً.');
            return;
        }
        if (!window.confirm(`هل أنت متأكد من حذف ${station.name}؟`)) return;

        try {
            await deleteGamingStation(station.id);
            setStations((prev) => prev.filter((s) => s.id !== station.id));
            toast.success(`تم حذف ${station.name}`);
        } catch (e) {
            console.error('Delete station failed:', e);
            toast.error('تعذر حذف الجهاز');
        }
    };

    // Handler: Create Station
    const handleCreateStation = async () => {
        if (!newStationName.trim()) {
            toast.error('يرجى إدخال اسم الجهاز');
            return;
        }
        playSound('select');
        try {
            const created = await createGamingStation({
                name: newStationName.trim(),
                category: newStationCategory,
                device_type: newStationDevice,
                rate_per_hour: newStationRate,
                multi_rate_per_hour: newStationMultiRate,
                rate_per_match: 0,
                status: 'available',
                display_order: stations.length + 1,
            });

            setStations((prev) => [...prev, created]);
            toast.success(`تمت إضافة ${created.name} بنجاح!`);
            setAddStationModalOpen(false);
            setNewStationName('');
        } catch (e) {
            console.error('Create station failed:', e);
            toast.error('تعذر إنشاء الجهاز');
        }
    };

    // Render Station Card
    const renderStationCard = (station: GamingStation) => {
        const session = sessions[station.id];
        const isBusy = station.status === 'busy' || (session && session.status === 'active');
        const isPaused = station.status === 'paused' || (session && session.status === 'paused');

        const elapsedSeconds = session ? getSessionElapsedSeconds(session) : 0;
        const timerFormatted = session ? formatDuration(elapsedSeconds) : '00:00:00';
        const timeCost = session ? calculateSessionTimeCost(session, station) : 0;
        const ordersTotal = session?.orders ? session.orders.reduce((sum, o) => sum + o.price * o.quantity, 0) : 0;

        return (
            <div
                key={station.id}
                className="bg-[#0e1320] border border-white/[0.08] hover:border-white/15 rounded-3xl p-5 flex flex-col justify-between shadow-lg relative transition-all"
            >
                {/* Top Header of Card */}
                <div className="flex items-center justify-between mb-2">
                    {/* Delete button (trash outline) on top-right in LTR / top-left in RTL */}
                    <button
                        onClick={() => handleDeleteStation(station)}
                        className="w-8 h-8 rounded-xl bg-red-950/20 hover:bg-red-950/50 border border-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-all cursor-pointer"
                        title="حذف الجهاز"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                        {isBusy && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-950/50 border border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse">
                                مشغول
                            </span>
                        )}
                        {isPaused && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/50 border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                                إيقاف مؤقت
                            </span>
                        )}
                        {!isBusy && !isPaused && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                متاح
                            </span>
                        )}
                    </div>
                </div>

                {/* Station Title & Badges */}
                <div className="text-right space-y-1.5 my-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {session?.is_multi && (
                                <span className="text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500/60 text-emerald-400 px-2 py-0.5 rounded">
                                    MULTI
                                </span>
                            )}
                        </div>
                        <h3 className="font-black text-2xl text-white tracking-wide">
                            {station.name}
                        </h3>
                    </div>

                    <div className="flex items-center justify-end gap-2 text-xs">
                        <span className="text-neutral-400 font-mono uppercase font-bold text-[11px]">
                            {station.device_type}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-neutral-300 font-mono text-[11px]">
                            {station.rate_per_hour} ج.م/س
                        </span>
                    </div>

                    {/* Session started info */}
                    {session && (
                        <div className="flex items-center justify-end gap-1.5 pt-1 text-[11px] text-neutral-400 font-medium">
                            <span className="font-mono" dir="ltr">
                                {new Date(session.start_time).toLocaleTimeString('ar-EG', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                            <Clock className="w-3 h-3 text-neutral-500" />
                            <span>•</span>
                            <span className="text-neutral-300">{session.started_by}</span>
                            <User className="w-3 h-3 text-neutral-500" />
                        </div>
                    )}
                </div>

                {/* Big Digital Timer Display */}
                <div className="my-3 bg-[#050811] border border-white/10 rounded-2xl py-4 px-3 text-center shadow-inner relative overflow-hidden">
                    <div
                        className={`font-mono font-black text-3xl sm:text-4xl tracking-widest tabular-nums ${
                            isBusy
                                ? 'text-[#00e5ff] drop-shadow-[0_0_15px_rgba(0,229,255,0.7)]'
                                : isPaused
                                ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.7)]'
                                : 'text-white/90'
                        }`}
                        dir="ltr"
                    >
                        {timerFormatted}
                    </div>

                    {session && (
                        <div className="flex items-center justify-center gap-3 text-[11px] font-mono text-neutral-400 mt-2">
                            <span>الوقت: {timeCost} ج.م</span>
                            {ordersTotal > 0 && <span>• طلبات: {ordersTotal} ج.م</span>}
                        </div>
                    )}
                </div>

                {/* Bottom Controls / Buttons */}
                {!session ? (
                    // Available State: Big Green Start Button
                    <button
                        onClick={() => handleOpenStartModal(station)}
                        className="w-full py-3.5 px-4 rounded-xl bg-[#00c978] hover:bg-[#00b26a] active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,201,120,0.35)] transition-all cursor-pointer"
                    >
                        <Clock className="w-5 h-5" />
                        <span>بداية</span>
                    </button>
                ) : (
                    // Busy State: 2x2 Action Grid + Full Width Pay Button
                    <div className="space-y-2 pt-1">
                        {/* 2x2 Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* الطلب (Add Order) */}
                            <button
                                onClick={() => handleOpenOrderModal(station)}
                                className="py-2.5 px-2 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>طلب</span>
                                {session.orders && session.orders.length > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
                                        {session.orders.length}
                                    </span>
                                )}
                            </button>

                            {/* إيقاف مؤقت / استئناف */}
                            <button
                                onClick={() => handleTogglePause(station)}
                                className={`py-2.5 px-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    isPaused
                                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60'
                                        : 'bg-amber-950/30 border-amber-500/30 text-amber-300 hover:bg-amber-900/50'
                                }`}
                            >
                                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                                <span>{isPaused ? 'استئناف' : 'إيقاف مؤقت'}</span>
                            </button>

                            {/* نقل (Transfer) */}
                            <button
                                onClick={() => handleOpenTransferModal(station)}
                                className="py-2.5 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                <span>نقل</span>
                            </button>

                            {/* تبديل Multi / Single (for consoles) */}
                            <button
                                onClick={() => handleToggleMulti(station)}
                                className="py-2.5 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                title="تبديل فردي / زوجي"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>{session.is_multi ? 'زوجي' : 'فردي'}</span>
                            </button>
                        </div>

                        {/* Adjust time mode button */}
                        <button
                            onClick={() => {
                                toast.info(`نظام الوقت للجلسة: ${session.time_system === 'open' ? 'وقت مفتوح' : 'وقت محدد'}`);
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-[#141a2a] hover:bg-[#1a2236] border border-white/10 text-neutral-300 font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                            <span>تعديل نظام الوقت</span>
                        </button>

                        {/* Notes Input */}
                        <div className="relative">
                            <input
                                type="text"
                                defaultValue={session.notes || ''}
                                placeholder="اكتب ملاحظاتك هنا..."
                                onBlur={(e) => updateSessionNotes(session.id, e.target.value)}
                                className="w-full py-2 px-3 pl-8 rounded-xl bg-black/40 border border-white/10 text-xs text-neutral-300 placeholder:text-neutral-500 focus:border-red-500 outline-none"
                            />
                            <Edit3 className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                        </div>

                        {/* Big Coral Red Pay Button */}
                        <button
                            onClick={() => handleOpenPayModal(station)}
                            className="w-full py-3 px-4 rounded-xl bg-[#ff4d4f] hover:bg-[#ff3538] active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,77,79,0.35)] transition-all cursor-pointer"
                        >
                            <span>دفع</span>
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 select-none" dir="rtl">
            {/* Top Bar: Category Filter Pills + Add Station Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
                {/* Left: Filter Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {/* All */}
                    <button
                        onClick={() => {
                            playSound('nav');
                            setActiveFilter('all');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                            activeFilter === 'all'
                                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                : 'bg-[#121829] text-neutral-400 hover:text-white border border-white/10'
                        }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span>الكل</span>
                        <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[11px] flex items-center justify-center font-mono">
                            {filterCounts.all}
                        </span>
                    </button>

                    {/* Consoles (PS5) */}
                    <button
                        onClick={() => {
                            playSound('nav');
                            setActiveFilter('console');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                            activeFilter === 'console'
                                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                : 'bg-[#121829] text-neutral-400 hover:text-white border border-white/10'
                        }`}
                    >
                        <Gamepad2 className="w-4 h-4" />
                        <span>PS5</span>
                        <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[11px] flex items-center justify-center font-mono">
                            {filterCounts.consoles}
                        </span>
                    </button>

                    {/* Recreation (Billiards) */}
                    <button
                        onClick={() => {
                            playSound('nav');
                            setActiveFilter('recreation');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                            activeFilter === 'recreation'
                                ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]'
                                : 'bg-[#121829] text-neutral-400 hover:text-white border border-white/10'
                        }`}
                    >
                        <CircleDot className="w-4 h-4" />
                        <span>بلياردو</span>
                        <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[11px] flex items-center justify-center font-mono">
                            {filterCounts.recreation}
                        </span>
                    </button>
                </div>

                {/* Right: Add New Station & Sound */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setAddStationModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4 text-emerald-400" />
                        <span>إضافة جهاز / طاولة</span>
                    </button>
                </div>
            </div>

            {/* SECTION 1: أجهزة الكونسول (Consoles) */}
            {(activeFilter === 'all' || activeFilter === 'console') && consoleStations.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-base sm:text-lg">
                        <Gamepad2 className="w-5 h-5 text-blue-500" />
                        <h2>أجهزة الكونسول (Consoles)</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {consoleStations.map((st) => renderStationCard(st))}
                    </div>
                </section>
            )}

            {/* SECTION 2: الترفيه والألعاب (Recreation) */}
            {(activeFilter === 'all' || activeFilter === 'recreation') && recreationStations.length > 0 && (
                <section className="space-y-3 pt-4">
                    <div className="flex items-center gap-2 text-orange-400 font-bold text-base sm:text-lg">
                        <CircleDot className="w-5 h-5 text-orange-500" />
                        <h2>الترفيه والألعاب (Recreation)</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {recreationStations.map((st) => renderStationCard(st))}
                    </div>
                </section>
            )}

            {/* Bottom Bar: Sound Switcher Pill */}
            <div className="pt-6 flex items-center justify-between text-xs text-neutral-400">
                <button
                    onClick={toggleSound}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121829] border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                    {soundEnabled ? (
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                        <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
                    )}
                    <span className="font-mono text-[11px] uppercase tracking-wider">
                        D95 SOUND SYSTEM • {soundEnabled ? 'مفعل' : 'مكتوم'}
                    </span>
                </button>

                <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-500">
                    <span>إجمالي الأجهزة: {stations.length}</span>
                    <span>•</span>
                    <span>الجلسات النشطة: {Object.keys(sessions).length}</span>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MODAL 1: START SESSION MODAL (EXACT REPLICA OF IMAGE 3)   */}
            {/* ========================================================= */}
            {startModalStation && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-[#111728] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-right">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <button
                                onClick={() => setStartModalStation(null)}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div>
                                <h3 className="text-lg font-black text-white flex items-center justify-end gap-2">
                                    <span>بدء تشغيل الجلسة</span>
                                    <span>🎮</span>
                                </h3>
                                <p className="text-xs text-neutral-400 font-mono">
                                    لجهاز: {startModalStation.name} ({startModalStation.device_type})
                                </p>
                            </div>
                        </div>

                        {/* Field 1: اختيار العميل (اختياري) */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-neutral-400 font-bold">
                                    عميل عام
                                </span>
                                <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-blue-400" />
                                    <span>اختيار العميل (اختياري)</span>
                                </label>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={startCustomerName}
                                    onChange={(e) => setStartCustomerName(e.target.value)}
                                    placeholder="اضغط لاختيار أو البحث عن عميل..."
                                    className="w-full py-2.5 px-3 pl-9 rounded-xl bg-[#090d18] border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:border-blue-500 outline-none"
                                />
                                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                            </div>
                        </div>

                        {/* Field 2: نظام الحساب */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-neutral-300 block">نظام الحساب</label>
                            <div className="grid grid-cols-2 gap-3">
                                {/* بالساعة */}
                                <button
                                    type="button"
                                    onClick={() => setStartPricingMode('hourly')}
                                    className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                        startPricingMode === 'hourly'
                                            ? 'bg-blue-950/40 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                            : 'bg-[#090d18] border-white/10 text-neutral-400 hover:border-white/20'
                                    }`}
                                >
                                    <Gamepad2 className="w-5 h-5" />
                                    <div className="font-bold text-sm">بالساعة</div>
                                    <div className="text-[11px] font-mono opacity-80">
                                        {startModalStation.rate_per_hour} ج.م/ساعة
                                    </div>
                                </button>

                                {/* بالمباراة */}
                                <button
                                    type="button"
                                    onClick={() => setStartPricingMode('match')}
                                    className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                        startPricingMode === 'match'
                                            ? 'bg-blue-950/40 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                            : 'bg-[#090d18] border-white/10 text-neutral-400 hover:border-white/20'
                                    }`}
                                >
                                    <Users className="w-5 h-5" />
                                    <div className="font-bold text-sm">بالمباراة</div>
                                    <div className="text-[11px] font-mono opacity-80">
                                        {startModalStation.rate_per_match || 0} ج.م/دور
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Multi Controller (For Consoles) */}
                        {startModalStation.category === 'console' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-300 block">نوع اللعب (الدراعات)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setStartIsMulti(false)}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                            !startIsMulti
                                                ? 'bg-blue-600 text-white border-blue-500'
                                                : 'bg-[#090d18] border-white/10 text-neutral-400'
                                        }`}
                                    >
                                        فردي (Single - {startModalStation.rate_per_hour} ج.م)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStartIsMulti(true)}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                            startIsMulti
                                                ? 'bg-blue-600 text-white border-blue-500'
                                                : 'bg-[#090d18] border-white/10 text-neutral-400'
                                        }`}
                                    >
                                        زوجي / مالتي (Multi - {startModalStation.multi_rate_per_hour} ج.م)
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Field 3: نظام الوقت */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-neutral-300 block">نظام الوقت</label>
                            <div className="grid grid-cols-2 gap-2 bg-[#090d18] p-1 rounded-xl border border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setStartTimeSystem('fixed')}
                                    className={`py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                        startTimeSystem === 'fixed'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-neutral-400 hover:text-white'
                                    }`}
                                >
                                    وقت محدد
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStartTimeSystem('open')}
                                    className={`py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                        startTimeSystem === 'open'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-neutral-400 hover:text-white'
                                    }`}
                                >
                                    وقت مفتوح
                                </button>
                            </div>

                            {/* If fixed time selected */}
                            {startTimeSystem === 'fixed' && (
                                <div className="flex items-center gap-2 pt-1">
                                    {[30, 60, 90, 120, 180].map((mins) => (
                                        <button
                                            key={mins}
                                            type="button"
                                            onClick={() => setStartTargetMinutes(mins)}
                                            className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold cursor-pointer transition-all ${
                                                startTargetMinutes === mins
                                                    ? 'bg-blue-600 border-blue-500 text-white'
                                                    : 'bg-white/5 border-white/10 text-neutral-400'
                                            }`}
                                        >
                                            {mins >= 60 ? `${mins / 60} س` : `${mins} د`}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Big Blue Start Button */}
                        <button
                            type="button"
                            onClick={handleConfirmStart}
                            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all cursor-pointer mt-2"
                        >
                            <span>بداية</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 2: ADD ORDER (طلب مشروبات وسناكس للجلسة)            */}
            {/* ========================================================= */}
            {orderModalStation && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-xl bg-[#111728] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-right max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <button
                                onClick={() => setOrderModalStation(null)}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div>
                                <h3 className="text-lg font-black text-white flex items-center justify-end gap-2">
                                    <span>إضافة طلب للجلسة</span>
                                    <ShoppingBag className="w-5 h-5 text-blue-400" />
                                </h3>
                                <p className="text-xs text-neutral-400 font-mono">
                                    حساب: {orderModalStation.name}
                                </p>
                            </div>
                        </div>

                        {/* Search & Categories */}
                        <div className="relative">
                            <input
                                type="text"
                                value={orderSearch}
                                onChange={(e) => setOrderSearch(e.target.value)}
                                placeholder="ابحث عن مشروب أو سناك..."
                                className="w-full py-2 px-3 pl-9 rounded-xl bg-[#090d18] border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:border-blue-500 outline-none"
                            />
                            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                        </div>

                        {/* Product Grid */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px]">
                            {products
                                .filter((p) => (orderSearch ? p.name.includes(orderSearch) : true))
                                .map((p) => {
                                    const inCart = tempOrderCart.find((x) => x.product.id === p.id);
                                    return (
                                        <div
                                            key={p.id}
                                            className="p-2.5 rounded-xl bg-[#090d18] border border-white/10 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleAddProductToCart(p)}
                                                    className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                                                >
                                                    +
                                                </button>
                                                {inCart && (
                                                    <span className="font-mono font-bold text-xs text-white px-2">
                                                        {inCart.qty}
                                                    </span>
                                                )}
                                                {inCart && (
                                                    <button
                                                        onClick={() => handleRemoveProductFromCart(p.id)}
                                                        className="w-7 h-7 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 flex items-center justify-center font-bold text-sm cursor-pointer"
                                                    >
                                                        -
                                                    </button>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <div className="font-bold text-xs text-white">{p.name}</div>
                                                <div className="text-[11px] font-mono text-emerald-400 font-bold">
                                                    {p.price} ج.م
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Cart Summary & Confirm */}
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                            <button
                                onClick={handleConfirmOrder}
                                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                                <Check className="w-4 h-4" />
                                <span>إضافة للجلسة</span>
                            </button>

                            <div className="text-right">
                                <div className="text-xs text-neutral-400">إجمالي الطلبات الجديدة:</div>
                                <div className="font-mono font-bold text-base text-white">
                                    {tempOrderCart.reduce((sum, item) => sum + item.product.price * item.qty, 0)} ج.م
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 3: TRANSFER SESSION (نقل الجلسة)                    */}
            {/* ========================================================= */}
            {transferModalStation && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#111728] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-right">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <button
                                onClick={() => setTransferModalStation(null)}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <span>نقل الجلسة من {transferModalStation.name} إلى:</span>
                                <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                            </h3>
                        </div>

                        <div className="space-y-2">
                            {stations
                                .filter((s) => s.id !== transferModalStation.id && !sessions[s.id])
                                .map((target) => (
                                    <button
                                        key={target.id}
                                        onClick={() => handleConfirmTransfer(target.id)}
                                        className="w-full p-3 rounded-xl bg-[#090d18] hover:bg-blue-950/40 border border-white/10 hover:border-blue-500/50 flex items-center justify-between transition-all cursor-pointer"
                                    >
                                        <span className="text-xs font-mono text-emerald-400 font-bold">
                                            {target.rate_per_hour} ج.م/س
                                        </span>
                                        <div className="text-right">
                                            <div className="font-bold text-sm text-white">{target.name}</div>
                                            <div className="text-[10px] text-neutral-400">{target.device_type}</div>
                                        </div>
                                    </button>
                                ))}

                            {stations.filter((s) => s.id !== transferModalStation.id && !sessions[s.id]).length === 0 && (
                                <p className="text-xs text-neutral-400 text-center py-4">
                                    لا توجد أجهزة أخرى متاحة حالياً للنقل!
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 4: PAY & SETTLE (دفع وإنهاء الجلسة)                  */}
            {/* ========================================================= */}
            {payModalStation && sessions[payModalStation.id] && (() => {
                const session = sessions[payModalStation.id];
                const elapsedSecs = getSessionElapsedSeconds(session);
                const timeCost = calculateSessionTimeCost(session, payModalStation);
                const ordersTotal = (session.orders || []).reduce((sum, o) => sum + o.price * o.quantity, 0);
                const grandTotal = Math.max(0, timeCost + ordersTotal - payDiscount);

                return (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-lg bg-[#111728] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-right max-h-[95vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                <button
                                    onClick={() => setPayModalStation(null)}
                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div>
                                    <h3 className="text-lg font-black text-white flex items-center justify-end gap-2">
                                        <span>حساب وإنهاء الجلسة</span>
                                        <Receipt className="w-5 h-5 text-red-500" />
                                    </h3>
                                    <p className="text-xs text-neutral-400 font-mono">
                                        جهاز: {payModalStation.name} • العميل: {session.customer_name}
                                    </p>
                                </div>
                            </div>

                            {/* Time & Bill Breakdown */}
                            <div className="bg-[#090d18] border border-white/10 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                                    <span className="font-mono font-bold text-white" dir="ltr">
                                        {formatDuration(elapsedSecs)}
                                    </span>
                                    <span className="text-neutral-400">مدة الجلسة:</span>
                                </div>

                                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                                    <span className="font-mono font-bold text-white">
                                        {timeCost} ج.م
                                    </span>
                                    <span className="text-neutral-400">حساب الوقت ({session.hourly_rate} ج.م/س):</span>
                                </div>

                                {/* Orders List */}
                                {session.orders && session.orders.length > 0 && (
                                    <div className="space-y-1.5 pb-2 border-b border-white/5">
                                        <div className="text-xs font-bold text-neutral-300">الطلبات المضافة:</div>
                                        {session.orders.map((ord, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-[11px] text-neutral-400">
                                                <span className="font-mono">{ord.price * ord.quantity} ج.م</span>
                                                <span>
                                                    {ord.name} (x{ord.quantity})
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                                    <span className="font-mono font-bold text-blue-400">{ordersTotal} ج.م</span>
                                    <span className="text-neutral-400">إجمالي المشروبات والسناكس:</span>
                                </div>

                                {/* Discount */}
                                <div className="flex items-center justify-between gap-3 text-xs">
                                    <input
                                        type="number"
                                        min="0"
                                        value={payDiscount || ''}
                                        onChange={(e) => setPayDiscount(Number(e.target.value) || 0)}
                                        placeholder="0"
                                        className="w-20 py-1 px-2 rounded-lg bg-black/50 border border-white/10 text-center font-mono font-bold text-xs text-white"
                                    />
                                    <span className="text-neutral-400">خصم إضافي (ج.م):</span>
                                </div>

                                {/* Grand Total */}
                                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                    <span className="font-mono font-black text-2xl text-red-500">
                                        {grandTotal} ج.م
                                    </span>
                                    <span className="text-sm font-bold text-white">المبلغ المطلوب للدفع:</span>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-300 block">طريقة الدفع</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['cash', 'instapay', 'wallet'] as const).map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setPayPaymentMethod(m)}
                                            className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                                payPaymentMethod === m
                                                    ? 'bg-red-600 border-red-500 text-white shadow-sm'
                                                    : 'bg-[#090d18] border-white/10 text-neutral-400'
                                            }`}
                                        >
                                            {m === 'cash' ? 'نقدي (كاش)' : m === 'instapay' ? 'إنستاباي' : 'محفظة كاش'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleConfirmPayment}
                                className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all cursor-pointer"
                            >
                                <Receipt className="w-5 h-5" />
                                <span>تأكيد الدفع ({grandTotal} ج.م) وإنهاء الجلسة</span>
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* ========================================================= */}
            {/* MODAL 5: ADD NEW STATION (إضافة جهاز جديد للداشبورد)       */}
            {/* ========================================================= */}
            {addStationModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#111728] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-right">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <button
                                onClick={() => setAddStationModalOpen(false)}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <span>إضافة جهاز / طاولة جديدة</span>
                                <Plus className="w-4 h-4 text-emerald-400" />
                            </h3>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-neutral-300 block mb-1">اسم الجهاز (مثلاً: Room 3 أو Billiards 2)</label>
                                <input
                                    type="text"
                                    value={newStationName}
                                    onChange={(e) => setNewStationName(e.target.value)}
                                    placeholder="Room 3"
                                    className="w-full py-2 px-3 rounded-xl bg-[#090d18] border border-white/10 text-xs text-white focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-neutral-300 block mb-1">القسم</label>
                                    <select
                                        value={newStationCategory}
                                        onChange={(e) => setNewStationCategory(e.target.value as 'console' | 'recreation')}
                                        className="w-full py-2 px-3 rounded-xl bg-[#090d18] border border-white/10 text-xs text-white focus:border-blue-500 outline-none cursor-pointer"
                                    >
                                        <option value="console">أجهزة الكونسول</option>
                                        <option value="recreation">الترفيه والألعاب</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-300 block mb-1">النوع</label>
                                    <input
                                        type="text"
                                        value={newStationDevice}
                                        onChange={(e) => setNewStationDevice(e.target.value)}
                                        placeholder="PS5"
                                        className="w-full py-2 px-3 rounded-xl bg-[#090d18] border border-white/10 text-xs text-white focus:border-blue-500 outline-none font-mono uppercase"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-neutral-300 block mb-1">السعر الفردي (ج.م/س)</label>
                                    <input
                                        type="number"
                                        value={newStationRate}
                                        onChange={(e) => setNewStationRate(Number(e.target.value))}
                                        className="w-full py-2 px-3 rounded-xl bg-[#090d18] border border-white/10 text-xs text-white font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-300 block mb-1">سعر الزوجي MULTI (ج.م/س)</label>
                                    <input
                                        type="number"
                                        value={newStationMultiRate}
                                        onChange={(e) => setNewStationMultiRate(Number(e.target.value))}
                                        className="w-full py-2 px-3 rounded-xl bg-[#090d18] border border-white/10 text-xs text-white font-mono"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCreateStation}
                                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer mt-3"
                            >
                                <Check className="w-4 h-4" />
                                <span>حفظ وإضافة الجهاز</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
