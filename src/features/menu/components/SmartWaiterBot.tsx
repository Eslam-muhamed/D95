import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, User, Sparkles, AlertCircle, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/features/cart/stores/cartStore';

// We import items to pass as context
import { getCachedCategories, getCachedProducts } from '@/features/menu/services/menuService';
import type { DBProduct } from '@/types/database';

export type Persona = 'dabour' | 'abu_malaz';

interface PersonaConfig {
  id: Persona;
  name: string;
  badge: string;
  avatar: string;
  headerBg: string;
  activeTabClass: string;
  userBubbleBg: string;
  sendBtnBg: string;
  welcome: string;
  placeholder: string;
}

const PERSONAS: Record<Persona, PersonaConfig> = {
  dabour: {
    id: 'dabour',
    name: 'دبور',
    badge: 'محمد',
    avatar: '/dabour.webp',
    headerBg: 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700',
    activeTabClass: 'bg-red-600 text-white shadow-lg shadow-red-900/40 border-red-500',
    userBubbleBg: 'bg-red-600',
    sendBtnBg: 'bg-red-600 hover:bg-red-700',
    welcome: 'أهلاً بك في D95 ☕🎮! أنا دبور، إزاي أقدر أساعدك وأرشحلك من المنيو النهارده؟',
    placeholder: 'اسأل دبور عن المنيو أو الأسعار...',
  },
  abu_malaz: {
    id: 'abu_malaz',
    name: 'أبو ملاذ',
    badge: 'احمد',
    avatar: '/abu-malaz.webp',
    headerBg: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700',
    activeTabClass: 'bg-amber-600 text-white shadow-lg shadow-amber-900/40 border-amber-500',
    userBubbleBg: 'bg-amber-600',
    sendBtnBg: 'bg-amber-600 hover:bg-amber-700',
    welcome: 'يا مية أهلاً وسهلاً بيك في D95! أنا أبو ملاذ في خدمتك، قولي نفسك في إيه يروّق عليك وهجهزهولك بأحسن جودة ☕✨',
    placeholder: 'اسأل أبو ملاذ عن أحسن طلب ليك...',
  }
};

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function SmartWaiterBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [activePersona, setActivePersona] = useState<Persona>('dabour');

  const [personaMessages, setPersonaMessages] = useState<Record<Persona, Message[]>>({
    dabour: [
      {
        id: 'welcome-dabour',
        role: 'model',
        text: PERSONAS.dabour.welcome
      }
    ],
    abu_malaz: [
      {
        id: 'welcome-abu-malaz',
        role: 'model',
        text: PERSONAS.abu_malaz.welcome
      }
    ]
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bubbleTextIndex, setBubbleTextIndex] = useState(0);
  const { addItem } = useCart();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentPersona = PERSONAS[activePersona];
  const messages = personaMessages[activePersona];

  // Alternating thought bubble slogans
  const bubblePhrases = ['اسأل دبور ☕', 'اسأل أبو ملاذ 🎩'];

  useEffect(() => {
    const timer = setInterval(() => {
      setBubbleTextIndex(prev => (prev + 1) % bubblePhrases.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [bubblePhrases.length]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!isOpen) return;

    if (messages.length <= 1) {
      scrollToBottom('auto');
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'model') {
      const lastMsgEl = document.getElementById(`msg-${lastMsg.id}`);
      if (lastMsgEl) {
        lastMsgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        scrollToBottom('smooth');
      }
    } else {
      scrollToBottom('smooth');
    }
  }, [isOpen, messages]);

  const generateMenuContext = () => {
    const categories = getCachedCategories();
    const products = getCachedProducts();
    if (!categories.length || !products.length) return 'المنيو غير متوفر حاليا';

    return categories.map(cat => {
      const catProducts = products.filter(p => p.category_id === cat.id);
      if (catProducts.length === 0) return '';
      return `\nقسم ${cat.name}:\n` + catProducts.map(p => `- [ID: ${p.id}] ${p.name} بـ ${p.price} جنيه`).join('\n');
    }).join('\n');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check daily message limit (max 1000 messages per day)
    const today = new Date().toISOString().split('T')[0];
    const usageStr = localStorage.getItem('d95_bot_usage');
    let usage = usageStr ? JSON.parse(usageStr) : { date: today, count: 0 };
    
    if (usage.date !== today) {
      usage = { date: today, count: 0 };
    }

    if (usage.count >= 1000) {
      setPersonaMessages(prev => ({
        ...prev,
        [activePersona]: [
          ...prev[activePersona],
          {
            id: Date.now().toString(),
            role: 'model',
            text: 'يسعدنا جداً تواصلك معانا! 🤩 وصلنا للحد الأقصى المسموح به للمحادثة اليوم.'
          }
        ]
      }));
      setInput('');
      return;
    }

    // Increment usage
    usage.count += 1;
    localStorage.setItem('d95_bot_usage', JSON.stringify(usage));

    const userText = input.trim();
    setInput('');
    
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setPersonaMessages(prev => ({
      ...prev,
      [activePersona]: [...prev[activePersona], newUserMsg]
    }));
    setIsLoading(true);

    try {
      // Build history for context (excluding initial welcome msg)
      const currentMessages = personaMessages[activePersona];
      const historyToPass = currentMessages.slice(1).map(m => ({ role: m.role, text: m.text }));
      const menuContext = generateMenuContext();

      // Call Supabase Edge Function with persona
      const { data, error } = await supabase.functions.invoke('smart-waiter', {
        body: {
          message: userText,
          history: historyToPass,
          menuContext,
          persona: activePersona
        }
      });

      if (error) throw error;

      const replyText = data?.reply || 'عذراً، حصلت مشكلة في الرد.';
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: replyText };
      
      setPersonaMessages(prev => ({
        ...prev,
        [activePersona]: [...prev[activePersona], botMsg]
      }));

    } catch (err) {
      console.error('Smart Waiter Error:', err);
      setPersonaMessages(prev => ({
        ...prev,
        [activePersona]: [
          ...prev[activePersona],
          {
            id: Date.now().toString(),
            role: 'model',
            text: 'عذراً، أواجه مشكلة في الاتصال حالياً 😔. برجاء المحاولة لاحقاً.'
          }
        ]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const playPopSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const handleAddToCart = (product: DBProduct) => {
    // Play sound effect
    playPopSound();
    
    addItem({
      id: String(product.id),
      name: product.name,
      price: product.price,
      image: product.image_url || '',
      category: String(product.category_id),
      customization: {
        quantity: 1
      }
    });
    // Add a small confirmation message
    setPersonaMessages(prev => ({
      ...prev,
      [activePersona]: [
        ...prev[activePersona],
        {
          id: Date.now().toString(),
          role: 'model',
          text: `تم إضافة ${product.name} للسلة بنجاح! 🛒`
        }
      ]
    }));
  };

  const renderMessageContent = (text: string) => {
    const parts = text.split(/(\[ADD_TO_CART:[a-zA-Z0-9-]+\])/g);
    const products = getCachedProducts();

    return (
      <div className="flex flex-col gap-2">
        {parts.map((part, index) => {
          const match = part.match(/\[ADD_TO_CART:([a-zA-Z0-9-]+)\]/);
          if (match) {
            const productIdStr = match[1];
            const product = products.find(p => String(p.id) === productIdStr);
            
            if (product) {
              return (
                <div key={index} className="mt-2 flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm">
                  <div className="flex items-center gap-2">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-red-600" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{product.name}</span>
                      <span className="font-bold text-[10px] text-red-600">{product.price} ج.م</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="p-2 sm:p-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2"
                    title="أضف للسلة"
                  >
                    <span className="text-xs font-bold hidden sm:inline-block">أضف</span>
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              );
            }
            return <span key={index} className="text-red-500 font-bold text-xs whitespace-pre-wrap mx-1">(عذراً، المنتج غير متوفر)</span>;
          }
          
          return part ? <span key={index} className="whitespace-pre-wrap">{part}</span> : null;
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Action Button (Twin Capsule) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-3"
          >
            <motion.button
              onClick={() => {
                setIsOpen(true);
                setHasOpened(true);
              }}
              className="group relative flex items-center gap-2 p-1.5 sm:p-2 bg-slate-900/90 hover:bg-slate-900 dark:bg-slate-800/95 backdrop-blur-md border border-slate-700/60 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="اسأل الويتر الذكي"
            >
              {/* Dual Avatars with Overlapping Rings */}
              <div className="flex items-center -space-x-3 rtl:space-x-reverse">
                {/* Dabour Avatar */}
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 p-0.5 shadow-md z-10 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1">
                  <img src="/dabour.webp" alt="دبور" className="w-full h-full object-contain filter drop-shadow" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
                </div>
                {/* Abu Malaz Avatar */}
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 p-0.5 shadow-md transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                  <img src="/abu-malaz.webp" alt="أبو ملاذ" className="w-full h-full object-contain filter drop-shadow" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
                </div>
              </div>

              {/* Text Badge (visible on desktop) */}
              <div className="hidden sm:flex flex-col text-right pl-2 pr-1">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  الويتر الذكي <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                </span>
                <span className="text-[10px] text-slate-300 font-medium">دبور & أبو ملاذ</span>
              </div>
            </motion.button>
            
            {/* Thought Bubble with smooth alternating text */}
            {!hasOpened && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="relative flex bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 font-bold text-xs sm:text-sm whitespace-nowrap"
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={bubbleTextIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    {bubblePhrases[bubbleTextIndex]}
                  </motion.span>
                </AnimatePresence>
                {/* Bubble Arrow */}
                <div className="absolute top-1/2 -right-1.5 sm:-right-2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white dark:bg-slate-800 border-r border-t border-slate-100 dark:border-slate-700 transform rotate-45"></div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-auto sm:right-6 w-full sm:w-[460px] md:w-[480px] h-[88dvh] sm:h-[660px] sm:max-h-[85vh] z-50 bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/30 border border-slate-200/80 dark:border-slate-800/80 flex flex-col overflow-hidden"
          >
            {/* Dynamic Header */}
            <div className={`${currentPersona.headerBg} text-white px-4 py-3 sm:px-5 transition-all duration-300 shrink-0 shadow-md z-10 flex flex-col gap-2.5`}>
              
              {/* Top Bar with Title and Close Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-1.5">
                    الويتر الذكي <Sparkles className="w-4 h-4 text-yellow-300" />
                  </span>
                  <span className="text-[11px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full font-medium">
                    D95 Menu
                  </span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="إغلاق المحادثة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Segmented Persona Switcher (Tabs) */}
              <div className="grid grid-cols-2 p-1 bg-black/25 backdrop-blur-md rounded-2xl gap-1 border border-white/10">
                {/* Dabour Tab */}
                <button
                  type="button"
                  onClick={() => setActivePersona('dabour')}
                  className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl transition-all font-bold text-xs border ${
                    activePersona === 'dabour'
                      ? PERSONAS.dabour.activeTabClass
                      : 'text-white/70 hover:text-white border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10 p-0.5 shrink-0 border border-white/20">
                    <img src={PERSONAS.dabour.avatar} alt="دبور" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col text-right leading-tight">
                    <span>دبور</span>
                    <span className="text-[9px] font-normal opacity-80">ويتر المنيو ☕</span>
                  </div>
                </button>

                {/* Abu Malaz Tab */}
                <button
                  type="button"
                  onClick={() => setActivePersona('abu_malaz')}
                  className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl transition-all font-bold text-xs border ${
                    activePersona === 'abu_malaz'
                      ? PERSONAS.abu_malaz.activeTabClass
                      : 'text-white/70 hover:text-white border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10 p-0.5 shrink-0 border border-white/20">
                    <img src={PERSONAS.abu_malaz.avatar} alt="أبو ملاذ" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col text-right leading-tight">
                    <span>أبو ملاذ</span>
                    <span className="text-[9px] font-normal opacity-80">الويتر المضياف 🎩</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900 scroll-smooth">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  id={`msg-${msg.id}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4 items-end gap-2`}
                >
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-slate-200 dark:bg-slate-800 p-0.5 border border-slate-300 dark:border-slate-700 shadow-sm">
                      <img src={currentPersona.avatar} alt={currentPersona.name} className="w-full h-full object-contain" />
                    </div>
                  )}
                  
                  <div className={`max-w-[88%] sm:max-w-[84%] rounded-2xl p-3.5 sm:p-4 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? `${currentPersona.userBubbleBg} text-white rounded-tl-none` 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tr-none'
                  }`}>
                    {renderMessageContent(msg.text)}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-slate-200 dark:bg-slate-800 p-0.5 border border-slate-300 dark:border-slate-700">
                    <img src={currentPersona.avatar} alt={currentPersona.name} className="w-full h-full object-contain animate-pulse" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tr-none p-3 shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-red-600/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-red-600/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Disclaimer */}
            <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-900/80 text-[10px] text-center text-slate-400 border-t border-slate-100 dark:border-slate-800/60 flex justify-center items-center gap-1 shrink-0">
              <AlertCircle className="w-3 h-3 text-slate-400" />
              <span>هذا المساعد مدعوم بالذكاء الاصطناعي وقد يُخطئ أحياناً</span>
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-500/20 transition-all"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={currentPersona.placeholder}
                  className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-900 dark:text-white outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`w-10 h-10 rounded-full ${currentPersona.sendBtnBg} text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
                >
                  <Send className="w-4 h-4 rtl:-scale-x-100" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
