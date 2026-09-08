import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gamepad2, Users, X } from 'lucide-react';
import SurpriseModal from './SurpriseModal';
import XOGame from './XOGame';
import SpyGame from './SpyGame';

const WHATSAPP_NUMBER = '201000000000';

export default function FloatingActionBar() {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<'surprise' | 'xo' | 'spy' | null>(null);

    return (
        <>
            {/* Pinned Bottom Floating Container */}
            <div
                className="fixed bottom-4 left-0 right-0 z-40 pointer-events-none px-4 flex justify-between items-center max-w-[440px] mx-auto pb-safe"
                dir="ltr"
            >
                {/* Left: WhatsApp Floating Button */}
                <motion.a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={{ scale: 0.9 }}
                    className="pointer-events-auto flex items-center justify-center rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.4)] transition-transform"
                    style={{
                        width: 48,
                        height: 48,
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        border: '1.5px solid rgba(255,255,255,0.2)',
                    }}
                    aria-label="تواصل واتساب"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                </motion.a>

                {/* Right: Smart Butler & Games Floating Pill (Guzel Style) */}
                <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setSheetOpen(true)}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full font-body font-bold text-xs md:text-sm text-white shadow-[0_4px_25px_rgba(181,42,69,0.5)] border border-white/20 backdrop-blur-xl cursor-pointer"
                    style={{
                        background: 'linear-gradient(135deg, rgba(181, 42, 69, 0.95), rgba(120, 20, 35, 0.95))',
                    }}
                >
                    <span className="font-medium tracking-wide" dir="rtl">الويتر والترفيه</span>
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                </motion.button>
            </div>

            {/* Bottom Sheet Drawer for Entertainment & Butler */}
            <AnimatePresence>
                {sheetOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSheetOpen(false)}
                            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                            className="fixed bottom-0 left-0 right-0 z-50 max-w-[440px] mx-auto bg-neutral-950 border-t border-white/10 rounded-t-3xl p-5 pb-8 shadow-2xl"
                            dir="rtl"
                        >
                            {/* Sheet Handle */}
                            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-display text-xl text-white font-bold tracking-wide">
                                        D95 LOUNGE & ENTERTAINMENT
                                    </h3>
                                    <p className="font-body text-xs text-neutral-400">
                                        خدمة الويتر الذكي وألعاب التسلية أثناء انتظارك
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSheetOpen(false)}
                                    className="p-2 rounded-full bg-white/5 text-neutral-400 hover:text-white cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5">
                                {/* Option 1: AI Butler Recommendation */}
                                <button
                                    onClick={() => {
                                        setSheetOpen(false);
                                        setActiveModal('surprise');
                                    }}
                                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-900/90 border border-white/5 hover:border-red-500/30 text-right transition-all group active:scale-[0.98] cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
                                        <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="font-bold text-white text-sm font-body">الويتر الذكي (اقترح لي)</h4>
                                            <span className="text-[10px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded font-bold">مفاجأة</span>
                                        </div>
                                        <p className="text-xs text-neutral-400 font-body">جاوب ٤ أسئلة سريعة ويقترحلك أفضل مشروب لمزاجك</p>
                                    </div>
                                </button>

                                {/* Option 2: XO Game */}
                                <button
                                    onClick={() => {
                                        setSheetOpen(false);
                                        setActiveModal('xo');
                                    }}
                                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-900/90 border border-white/5 hover:border-amber-500/30 text-right transition-all group active:scale-[0.98] cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                                        <Gamepad2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="font-bold text-white text-sm font-body">لعبة التحدي XO</h4>
                                            <span className="text-[10px] bg-amber-600/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">تحدي</span>
                                        </div>
                                        <p className="text-xs text-neutral-400 font-body">العب جولة تيك تاك تو سريعة مع صاحبك على الطاولة</p>
                                    </div>
                                </button>

                                {/* Option 3: Spy Game */}
                                <button
                                    onClick={() => {
                                        setSheetOpen(false);
                                        setActiveModal('spy');
                                    }}
                                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-900/90 border border-white/5 hover:border-purple-500/30 text-right transition-all group active:scale-[0.98] cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                                        <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="font-bold text-white text-sm font-body">لعبة كشف الجاسوس</h4>
                                            <span className="text-[10px] bg-purple-600/20 text-purple-400 px-1.5 py-0.5 rounded font-bold">للشلة</span>
                                        </div>
                                        <p className="text-xs text-neutral-400 font-body">لعبة جماعية للمجموعات تكشف مين فيكم الجاسوس</p>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Active Modals */}
            {activeModal === 'surprise' && <SurpriseModal onClose={() => setActiveModal(null)} />}
            {activeModal === 'xo' && <XOGame onClose={() => setActiveModal(null)} />}
            {activeModal === 'spy' && <SpyGame onClose={() => setActiveModal(null)} />}
        </>
    );
}
