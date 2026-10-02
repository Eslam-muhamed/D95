import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { fetchPaymentSettings } from '@/services/paymentSettingsService';
import { CONTACT_INFO } from '@/constants/contactInfo';

export default function FloatingWhatsApp() {
    const [waNumber, setWaNumber] = useState<string>('');
    const [isVisible, setIsVisible] = useState<boolean>(true);

    useEffect(() => {
        fetchPaymentSettings().then((res) => {
            if (res && res.whatsappNumber) {
                setWaNumber(res.whatsappNumber);
            } else {
                setWaNumber(CONTACT_INFO.whatsappNumber);
            }
        });
    }, []);

    if (!waNumber || !isVisible) return null;

    const waUrl = `https://wa.me/${waNumber.startsWith('+2') ? waNumber.substring(2) : waNumber}`;

    return (
        <div className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-40 flex flex-col items-end gap-1">
            <button
                onClick={() => setIsVisible(false)}
                className="bg-white/80 dark:bg-black/80 text-neutral-500 hover:text-neutral-800 dark:hover:text-white rounded-full p-1 shadow-sm border border-neutral-200 dark:border-white/10 backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
                aria-label="إخفاء زر الواتساب"
                title="إخفاء"
            >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-green-500 text-white rounded-full shadow-[0_4px_14px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:scale-105 hover:shadow-[0_6px_20px_rgba(34,197,94,0.6)] active:scale-95 transition-all duration-300"
                aria-label="تواصل معنا عبر واتساب"
                title="تواصل معنا"
            >
                <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 group-hover:animate-ping" />
                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" />
            </a>
        </div>
    );
}
