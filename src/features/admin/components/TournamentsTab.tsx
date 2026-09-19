import { useState, useEffect } from 'react';
import { Trophy, Plus, Eye, EyeOff, Edit, Trash2, Users, Loader2 } from 'lucide-react';
import { tournamentService } from '@/services/tournamentService';
import { DBTournament } from '@/types/database';
import { toast } from 'sonner';
import TournamentParticipantsModal from './TournamentParticipantsModal';

export default function TournamentsTab() {
    const [tournaments, setTournaments] = useState<DBTournament[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTournament, setSelectedTournament] = useState<DBTournament | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        game: '',
        start_date: '',
        entry_fee: 0,
        prize: '',
        status: 'upcoming',
        is_active_in_ui: false
    });

    const loadTournaments = async () => {
        setIsLoading(true);
        try {
            const data = await tournamentService.fetchAllTournaments();
            setTournaments(data);
        } catch (error: any) {
            toast.error(error.message || 'فشل تحميل البطولات');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTournaments();
    }, []);

    const handleToggleUI = async (t: DBTournament) => {
        try {
            await tournamentService.updateTournament(t.id, { is_active_in_ui: !t.is_active_in_ui });
            toast.success(`تم ${t.is_active_in_ui ? 'إخفاء' : 'إظهار'} البطولة للعملاء`);
            loadTournaments();
        } catch (error: any) {
            toast.error('حدث خطأ أثناء التحديث');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه البطولة نهائياً؟')) return;
        try {
            await tournamentService.deleteTournament(id);
            toast.success('تم حذف البطولة');
            loadTournaments();
        } catch (error: any) {
            toast.error('حدث خطأ أثناء الحذف');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await tournamentService.createTournament({
                ...formData,
                start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
                end_date: null
            });
            toast.success('تم إنشاء البطولة بنجاح');
            setIsCreating(false);
            setFormData({ name: '', game: '', start_date: '', entry_fee: 0, prize: '', status: 'upcoming', is_active_in_ui: false });
            loadTournaments();
        } catch (error: any) {
            console.error('Error creating tournament:', error);
            toast.error(error?.message || error?.details || 'فشل في إنشاء البطولة (تحقق من الصلاحيات)');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-amber-500" />
                        إدارة البطولات
                    </h2>
                    <p className="text-sm text-slate-500">إضافة ومتابعة البطولات والمشتركين</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>{isCreating ? 'إلغاء' : 'بطولة جديدة'}</span>
                </button>
            </div>

            {isCreating && (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <h3 className="text-lg font-bold mb-4 text-slate-900">تفاصيل البطولة الجديدة</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-1 text-slate-700">اسم البطولة</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="مثال: بطولة فيفا الكبرى" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-slate-700">اللعبة</label>
                                <input type="text" required value={formData.game} onChange={e => setFormData({...formData, game: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="مثال: FC 24" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-slate-700">رسوم الاشتراك (جنيه)</label>
                                <input type="number" required min="0" value={formData.entry_fee} onChange={e => setFormData({...formData, entry_fee: Number(e.target.value)})} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-slate-700">تاريخ البطولة</label>
                                <input type="datetime-local" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold mb-1 text-slate-700">الجائزة</label>
                                <input type="text" value={formData.prize} onChange={e => setFormData({...formData, prize: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="مثال: 1000 جنيه للمركز الأول" />
                            </div>
                            <div className="md:col-span-2 flex items-center gap-2 mt-2">
                                <input type="checkbox" id="is_active_in_ui" checked={formData.is_active_in_ui} onChange={e => setFormData({...formData, is_active_in_ui: e.target.checked})} className="w-4 h-4 rounded text-red-600 focus:ring-red-500" />
                                <label htmlFor="is_active_in_ui" className="text-sm font-bold cursor-pointer text-slate-700">إظهار البطولة للعملاء فوراً</label>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button type="submit" className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors cursor-pointer">حفظ وإضافة</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournaments.map(t => (
                    <div key={t.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-black text-lg text-slate-900">{t.name}</h3>
                                <span className="text-xs font-bold text-red-600">{t.game}</span>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                t.status === 'active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                                t.status === 'completed' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                                'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                                {t.status === 'active' ? 'جارية' : t.status === 'completed' ? 'منتهية' : 'قادمة'}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1 text-sm text-slate-600">
                            <span>التاريخ: {t.start_date ? new Date(t.start_date).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                            <span>الرسوم: {t.entry_fee} جنيه</span>
                            <span>الجائزة: {t.prize || '-'}</span>
                        </div>

                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleUI(t)}
                                    className={`p-2 rounded-lg transition-colors cursor-pointer ${t.is_active_in_ui ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-800'}`}
                                    title={t.is_active_in_ui ? 'مخفية - اضغط للإخفاء' : 'مخفية - اضغط للإظهار'}
                                >
                                    {t.is_active_in_ui ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setSelectedTournament(t)}
                                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                                    title="المشتركين"
                                >
                                    <Users className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Future: edit button */}
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                    title="حذف"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {tournaments.length === 0 && !isCreating && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-200 rounded-3xl">
                        <Trophy className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-bold">لا يوجد بطولات حالية</p>
                        <button onClick={() => setIsCreating(true)} className="mt-4 text-red-600 hover:text-red-700 font-medium underline cursor-pointer">إنشاء بطولة جديدة</button>
                    </div>
                )}
            </div>

            {selectedTournament && (
                <TournamentParticipantsModal
                    tournament={selectedTournament}
                    onClose={() => setSelectedTournament(null)}
                />
            )}
        </div>
    );
}
