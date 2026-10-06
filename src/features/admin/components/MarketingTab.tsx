import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Users, Download, Copy, SendHorizonal } from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
  id: string;
  phone_number: string;
  full_name: string | null;
  loyalty_points_balance: number;
}

export default function MarketingTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageTemplate, setMessageTemplate] = useState('أهلاً بك في D95 Lounge 🎮☕\n\nحبينا نعرف رأيك في تجربتك معانا وهل في أي ملاحظات نقدر نحسن بيها الخدمة؟ \n\nتقييمك يهمنا جداً!');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err: any) {
      toast.error('حدث خطأ أثناء تحميل بيانات العملاء');
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppLink = (phone: string, name: string | null) => {
    // Basic Egypt phone number formatting for WA link
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('01')) {
      formattedPhone = '2' + formattedPhone;
    }
    
    let text = messageTemplate;
    if (name) {
      text = `أهلاً ${name}،\n\n` + text;
    }
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  };

  const copyAllNumbers = () => {
    const numbers = customers.map(c => c.phone_number).join('\n');
    navigator.clipboard.writeText(numbers);
    toast.success('تم نسخ جميع الأرقام بنجاح');
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Loyalty Points'];
    const rows = customers.map(c => [c.full_name || 'بدون اسم', c.phone_number, c.loyalty_points_balance]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner shrink-0">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">التسويق عبر واتساب</h2>
            <p className="text-sm text-slate-500 font-medium">تواصل مع عملائك لعرض الخصومات أو طلب التقييم</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-bold border border-emerald-100">
                <Users className="w-4 h-4" />
                <span>{customers.length} عميل</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Form */}
        <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <SendHorizonal className="w-5 h-5 text-emerald-500" />
                    محتوى الرسالة
                </h3>
                <textarea
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    rows={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none outline-none"
                    placeholder="اكتب رسالتك هنا..."
                />
                <p className="text-[11px] text-slate-500 mt-2">
                    ملاحظة: سيتم إضافة اسم العميل تلقائياً في بداية الرسالة إذا كان مسجلاً.
                </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                 <h3 className="font-bold text-slate-800 mb-2">أدوات إضافية (إرسال جماعي)</h3>
                 <button onClick={copyAllNumbers} className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-colors cursor-pointer">
                     <Copy className="w-4 h-4" />
                     نسخ كل الأرقام
                 </button>
                 <button onClick={exportToCSV} className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl font-bold transition-colors cursor-pointer">
                     <Download className="w-4 h-4" />
                     تصدير الأرقام (CSV)
                 </button>
                 <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                     استخدم التصدير أو النسخ إذا كنت تستخدم برامج أو إضافات للإرسال الجماعي عبر الواتساب.
                 </p>
            </div>
        </div>

        {/* Customer List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
           <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-slate-800">قائمة العملاء (إرسال فردي)</h3>
           </div>
           
           <div className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-slate-200">
               {loading ? (
                   <div className="flex justify-center items-center h-full">
                       <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                   </div>
               ) : customers.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-full text-slate-500">
                       <Users className="w-12 h-12 text-slate-300 mb-3" />
                       <p>لا يوجد عملاء مسجلين حتى الآن</p>
                   </div>
               ) : (
                   <div className="divide-y divide-slate-100">
                       {customers.map((customer) => (
                           <div key={customer.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                               <div>
                                   <p className="font-bold text-slate-800">{customer.full_name || 'بدون اسم'}</p>
                                   <p className="text-sm text-slate-500 font-mono mt-0.5 text-left" dir="ltr">{customer.phone_number}</p>
                               </div>
                               <a
                                   href={getWhatsAppLink(customer.phone_number, customer.full_name)}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm shadow-emerald-200 active:scale-95"
                               >
                                   <MessageCircle className="w-4 h-4" />
                                   <span className="hidden sm:inline">مراسلة</span>
                               </a>
                           </div>
                       ))}
                   </div>
               )}
           </div>
        </div>
      </div>
    </div>
  );
}
