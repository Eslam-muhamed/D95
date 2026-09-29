import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, User, Sparkles, AlertCircle, ShoppingCart, ArrowLeftRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/features/cart/stores/cartStore';

// We import items to pass as context
import { getCachedCategories, getCachedProducts } from '@/features/menu/services/menuService';
import type { DBProduct } from '@/types/database';

export type Persona = 'dabour' | 'abu_malaz';

interface PersonaConfig {
  id: Persona;
  name: string;
  realName: string;
  badge: string;
  avatar: string;
  headerBg: string;
  cardBorder: string;
  cardHoverBg: string;
  userBubbleBg: string;
  sendBtnBg: string;
  welcome: string;
  placeholder: string;
  description: string;
}

const PERSONAS: Record<Persona, PersonaConfig> = {
  dabour: {
    id: 'dabour',
    name: 'دبور',
    realName: 'محمد',
    badge: 'صاحب المكان ☕',
    avatar: '/dabour.webp',
    headerBg: 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700',
    cardBorder: 'hover:border-red-500 hover:shadow-red-500/20',
    cardHoverBg: 'hover:bg-red-500/10',
    userBubbleBg: 'bg-red-600',
    sendBtnBg: 'bg-red-600 hover:bg-red-700',
    welcome: 'أهلاً بك في D95 ☕🎮! أنا دبور، إزاي أقدر أساعدك وأرشحلك من المنيو النهارده؟',
    placeholder: 'اسأل دبور عن المنيو أو الأسعار...',
    description: 'شاب مرح وصاحب المكان، هيظبطلك أحسن مشروبات وسناكس للعب والرواقان 🔥'
  },
  abu_malaz: {
    id: 'abu_malaz',
    name: 'أبو ملاذ',
    realName: 'أحمد',
    badge: 'صاحب المكان ✨',
    avatar: '/abu-malaz.webp',
    headerBg: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700',
    cardBorder: 'hover:border-amber-500 hover:shadow-amber-500/20',
    cardHoverBg: 'hover:bg-amber-500/10',
    userBubbleBg: 'bg-amber-600',
    sendBtnBg: 'bg-amber-600 hover:bg-amber-700',
    welcome: 'يا مية أهلاً وسهلاً بيك في D95! أنا أبو ملاذ هنا عشان اساعدك تختار المشروب اللي يعدل مزاجك، قولي نفسك في إيه يروّق عليك وهجهزهولك بأحسن جودة ✨',
    placeholder: 'اسأل أبو ملاذ عن أحسن طلب ليك...',
    description: 'راقي وشهم ومضياف، هيعدل مزاجك بأحلى ترشيحات مخدومة بحب في مكانه 🎩'
  }
};

// Eagerly preload and decode persona images into browser GPU memory for instant 0ms render
if (typeof window !== 'undefined') {
  const preloadPersona = (src: string) => {
    const img = new Image();
    img.src = src;
    if ('decode' in img) {
      img.decode().catch(() => {});
    }
  };
  preloadPersona('/dabour.webp');
  preloadPersona('/abu-malaz.webp');
}

interface SpotlightInfo {
  name: string;
  realName: string;
  role: string;
  badgeBg: string;
  bubbleBorder: string;
  glowClass: string;
  quotes: string[];
}

const SPOTLIGHT_DATA: Record<Persona, SpotlightInfo> = {
  dabour: {
    name: 'دبور',
    realName: 'محمد',
    role: 'صاحب ومؤسس المكان ☕',
    badgeBg: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
    bubbleBorder: 'border-red-500/30 shadow-red-500/10',
    glowClass: 'shadow-[0_0_28px_rgba(239,68,68,0.4)] border-red-500/50',
    quotes: [
      'منور يا غالي! شاورلي ع اللي ف خاطرك ونظبطك ☕',
      'تحب تشرب إيه النهارده؟ قولي وأنا في خدمتك 🔥',
      'مزاجك قهوة ولا حاجة ساقعة تروّق عليك؟ 🎮'
    ]
  },
  abu_malaz: {
    name: 'أبو ملاذ',
    realName: 'أحمد',
    role: 'صاحب ومؤسس المكان ✨',
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    bubbleBorder: 'border-amber-500/30 shadow-amber-500/10',
    glowClass: 'shadow-[0_0_28px_rgba(245,158,11,0.4)] border-amber-500/50',
    quotes: [
      'المكان مكانك ومنورنا! قولي نفسك في إيه ✨',
      'يا مرحب بيك في D95.. طلبك متظبط بأعلى جودة 🎩',
      'نورتنا وشرفتنا يا فنان.. تشرب إيه يعدل دماغك؟ 🌟'
    ]
  }
};

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function SmartWaiterBot() {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // User's default chosen persona for the session (persists until they leave the site)
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('d95_selected_persona');
      if (saved === 'dabour' || saved === 'abu_malaz') {
        return saved as Persona;
      }
    }
    return null;
  });

  const [activePersona, setActivePersona] = useState<Persona>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('d95_selected_persona');
      if (saved === 'dabour' || saved === 'abu_malaz') {
        return saved as Persona;
      }
    }
    return 'dabour';
  });

  // Spotlight animation state: alternates heads & sentences inside floating bubble (only before a persona is chosen)
  const [quoteCycle, setQuoteCycle] = useState(0);
  const spotlightPersona: Persona = quoteCycle % 2 === 0 ? 'dabour' : 'abu_malaz';
  const [isQuoteDismissed, setIsQuoteDismissed] = useState(false);

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
  const { addItem } = useCart();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentPersona = PERSONAS[activePersona];
  const messages = personaMessages[activePersona];

  // Alternating spotlight timer (active only before a persona is selected)
  useEffect(() => {
    if (selectedPersona) return; // Do not cycle once a persona is selected
    const timer = setInterval(() => {
      setQuoteCycle(prev => prev + 1);
    }, 4500);
    return () => clearInterval(timer);
  }, [selectedPersona]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!isChatOpen) return;

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
  }, [isChatOpen, messages]);

  const handleOpenSelector = () => {
    if (isChatOpen) {
      setIsChatOpen(false);
    }
    setIsSelectorOpen(true);
  };

  const handleSelectPersona = (persona: Persona) => {
    setActivePersona(persona);
    setSelectedPersona(persona);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('d95_selected_persona', persona);
    }
    setIsSelectorOpen(false);
    setIsChatOpen(true);
  };

  const handleSwitchToPersona = (persona: Persona) => {
    setActivePersona(persona);
    setSelectedPersona(persona);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('d95_selected_persona', persona);
    }
  };

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

      // Call Supabase Edge Function with selected persona
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
    // Add confirmation message
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

  const currentSpotlight = SPOTLIGHT_DATA[spotlightPersona];
  const personaTurn = Math.floor(quoteCycle / 2);
  const activeQuote = currentSpotlight.quotes[personaTurn % currentSpotlight.quotes.length];

  return (
    <>
      {/* 1. Floating Action Bubble with Dual Heads & Alternating Spotlight */}
      <AnimatePresence>
        {!isChatOpen && !isSelectorOpen && (
          selectedPersona ? (
            /* Selected Persona Default: Clean Cutout Head WITHOUT ANY Background, Yellow, Red, or Bubble */
            <motion.div
              key="selected-persona-floating"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5 sm:gap-3.5 select-none"
            >
              {/* Clean Cutout Head - Strictly NO background, NO red, NO yellow, NO bubble container */}
              <motion.button
                type="button"
                onClick={() => setIsChatOpen(true)}
                animate={{
                  y: [0, -7, 0],
                }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                whileHover={{ scale: 1.12, rotate: 2 }}
                whileTap={{ scale: 0.92 }}
                className="relative p-0 bg-transparent border-0 cursor-pointer select-none focus:outline-none group"
                aria-label={`تحدث مع ${currentPersona.name}`}
                title={`تحدث مع ${currentPersona.name} (${currentPersona.realName})`}
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                  <img
                    src={currentPersona.avatar}
                    alt={currentPersona.name}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    width={80}
                    height={80}
                    className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)] transition-all pointer-events-none"
                  />
                  {/* Live online dot indicator */}
                  <span className="absolute bottom-0 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full shadow-md animate-pulse" />
                </div>
              </motion.button>

              {/* Thought/Speech Bubble from the selected owner */}
              {!isQuoteDismissed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, x: 15 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.88, x: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsChatOpen(true)}
                  className={`relative max-w-[195px] sm:max-w-[260px] p-2.5 sm:p-3.5 rounded-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border ${currentPersona.id === 'dabour' ? 'border-red-500/30 shadow-red-500/10' : 'border-amber-500/30 shadow-amber-500/10'} shadow-2xl cursor-pointer text-right transition-colors duration-500`}
                >
                  {/* Dismiss button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsQuoteDismissed(true);
                    }}
                    className="absolute top-1.5 left-1.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
                    title="إغلاق التلميح"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {/* Speaker Identity Badge */}
                  <div className="flex items-center gap-1.5 mb-1 pl-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold ${currentPersona.id === 'dabour' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${currentPersona.id === 'dabour' ? 'bg-red-500' : 'bg-amber-500'} animate-ping`} />
                      {currentPersona.name} ({currentPersona.realName})
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      صاحب المكان
                    </span>
                  </div>

                  {/* Spoken Quote */}
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                    {currentPersona.id === 'dabour'
                      ? 'شاورلي ع اللي ف خاطرك ونظبطك يا غالي ☕'
                      : 'المكان مكانك ومنورنا.. قولي نفسك في إيه ✨'}
                  </p>

                  {/* Tap hint */}
                  <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    <span>اضغط للتحدث</span>
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                  </div>

                  {/* Bubble Tail pointing toward the head */}
                  <div className="absolute top-1/2 -right-1.5 sm:-right-2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-white dark:bg-slate-900 border-r border-t border-slate-200 dark:border-slate-700 transform rotate-45" />
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* Initial Dual-Head Bubble: Shown only before a persona is selected */
            <motion.div
              key="dual-bubble-initial"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5 sm:gap-3.5 select-none"
            >
              {/* The Glass Bubble Orb with Both Heads Inside */}
              <motion.div
                animate={{
                  y: [0, -7, 0],
                  rotate: [0, 1.2, 0, -1.2, 0],
                }}
                transition={{
                  duration: 3.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative cursor-pointer group"
                onClick={handleOpenSelector}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                title="اضغط للتحدث مع أصحاب المكان"
                aria-label="اسأل أصحاب المكان"
              >
                {/* Outer Breathing Aura (Harmonized with Active Founder) */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.35, 0.7, 0.35],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className={`absolute -inset-1.5 rounded-full blur-lg transition-colors duration-700 pointer-events-none ${
                    spotlightPersona === 'dabour'
                      ? 'bg-gradient-to-tr from-red-600/40 via-rose-500/30 to-amber-500/10'
                      : 'bg-gradient-to-tr from-amber-500/40 via-orange-500/30 to-red-500/10'
                  }`}
                />

                {/* Orbiting micro-bubbles */}
                <motion.div
                  animate={{ y: [0, -10, 0], x: [0, -3, 0], opacity: [0.3, 0.85, 0.3] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-1.5 right-2 w-2.5 h-2.5 rounded-full bg-white/40 border border-white/60 blur-[0.2px] pointer-events-none z-30 shadow-sm"
                />
                <motion.div
                  animate={{ y: [0, 8, 0], x: [0, 4, 0], opacity: [0.2, 0.75, 0.2] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                  className="absolute bottom-1 -left-1.5 w-2 h-2 rounded-full bg-white/30 border border-white/50 blur-[0.2px] pointer-events-none z-30 shadow-sm"
                />

                {/* The Glass Bubble Sphere */}
                <div
                  className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full backdrop-blur-xl bg-slate-950/80 dark:bg-slate-950/90 border-2 transition-all duration-700 shadow-2xl flex items-center justify-center overflow-hidden ${currentSpotlight.glowClass}`}
                >
                  {/* Specular glass reflection highlight at top of bubble */}
                  <div className="absolute top-1 left-2.5 right-2.5 h-6 sm:h-7 rounded-full bg-gradient-to-b from-white/35 via-white/10 to-transparent pointer-events-none z-30" />
                  {/* Subtle bottom glass reflection */}
                  <div className="absolute bottom-1.5 right-3 w-5 h-2 rounded-full bg-white/10 blur-[1px] pointer-events-none z-30" />

                  {/* 1. Dabour Head inside bubble */}
                  <motion.div
                    animate={
                      spotlightPersona === 'dabour'
                        ? {
                            x: -2,
                            y: 3,
                            scale: 1.18,
                            zIndex: 25,
                            opacity: 1,
                            filter: 'drop-shadow(0 4px 10px rgba(239, 68, 68, 0.6))',
                          }
                        : {
                            x: -16,
                            y: -10,
                            scale: 0.65,
                            zIndex: 10,
                            opacity: 0.55,
                            filter: 'blur(0.4px) drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                          }
                    }
                    transition={{
                      type: 'spring',
                      stiffness: 190,
                      damping: 22,
                    }}
                    className="absolute w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 p-0.5 border border-white/30"
                  >
                    {/* Gentle continuous float */}
                    <motion.div
                      animate={{ y: [0, -3.5, 0] }}
                      transition={{ duration: 2.7, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-full h-full relative"
                    >
                      <img
                        src="/dabour.webp"
                        alt="دبور"
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        width={56}
                        height={56}
                        className="w-full h-full object-contain filter drop-shadow select-none pointer-events-none"
                      />
                      {spotlightPersona === 'dabour' && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-slate-950 rounded-full shadow-sm" />
                      )}
                    </motion.div>
                  </motion.div>

                  {/* 2. Abu Malaz Head inside bubble */}
                  <motion.div
                    animate={
                      spotlightPersona === 'abu_malaz'
                        ? {
                            x: 2,
                            y: 3,
                            scale: 1.18,
                            zIndex: 25,
                            opacity: 1,
                            filter: 'drop-shadow(0 4px 10px rgba(245, 158, 11, 0.6))',
                          }
                        : {
                            x: 16,
                            y: -10,
                            scale: 0.65,
                            zIndex: 10,
                            opacity: 0.55,
                            filter: 'blur(0.4px) drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                          }
                    }
                    transition={{
                      type: 'spring',
                      stiffness: 190,
                      damping: 22,
                    }}
                    className="absolute w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 p-0.5 border border-white/30"
                  >
                    {/* Gentle continuous float */}
                    <motion.div
                      animate={{ y: [0, 3.5, 0] }}
                      transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                      className="w-full h-full relative"
                    >
                      <img
                        src="/abu-malaz.webp"
                        alt="أبو ملاذ"
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        width={56}
                        height={56}
                        className="w-full h-full object-contain filter drop-shadow select-none pointer-events-none"
                      />
                      {spotlightPersona === 'abu_malaz' && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-slate-950 rounded-full shadow-sm" />
                      )}
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>

              {/* 2. Thought / Speech Bubble with the Alternating Sentence */}
              {!isQuoteDismissed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, x: 15 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.88, x: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOpenSelector}
                  className={`relative max-w-[195px] sm:max-w-[270px] p-2.5 sm:p-3.5 rounded-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border ${currentSpotlight.bubbleBorder} shadow-2xl cursor-pointer text-right transition-colors duration-500`}
                >
                  {/* Dismiss button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsQuoteDismissed(true);
                    }}
                    className="absolute top-1.5 left-1.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors z-10"
                    title="إغلاق التلميح"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {/* Inner dynamic content: smoothly cross-fades quote and badge on cycle change */}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={quoteCycle}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                    >
                      {/* Speaker Identity Badge */}
                      <div className="flex items-center gap-1.5 mb-1 pl-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold ${currentSpotlight.badgeBg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${spotlightPersona === 'dabour' ? 'bg-red-500' : 'bg-amber-500'} animate-ping`} />
                          {currentSpotlight.name} ({currentSpotlight.realName})
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {currentSpotlight.role.includes('☕') ? '☕' : '✨'}
                        </span>
                      </div>

                      {/* Spoken Quote */}
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                        {activeQuote}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* Tap hint */}
                  <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    <span>اضغط للتحدث</span>
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                  </div>

                  {/* Bubble Tail pointing toward the glass orb */}
                  <div className="absolute top-1/2 -right-1.5 sm:-right-2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-white dark:bg-slate-900 border-r border-t border-slate-200 dark:border-slate-700 transform rotate-45" />
                </motion.div>
              )}
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* 2. Waiter Selection Modal (Popup) */}
      <AnimatePresence>
        {isSelectorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-sm sm:max-w-md bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/80 flex flex-col gap-4 overflow-hidden text-white"
            >
              {/* Subtle Ambient Top Rim Light */}
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setIsSelectorOpen(false)}
                className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                aria-label="إغلاق"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Title */}
              <div className="text-center pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  أصحاب ومؤسسي D95
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  مع مين تحب تدردش؟ ☕
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  اختر صاحب المكان اللي حابب يقترحلك ويظبطلك طلبك من المنيو
                </p>
              </div>

              {/* Two Owner Selection Cards */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-1">
                
                {/* 1. Dabour Card */}
                <motion.button
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectPersona('dabour')}
                  className="group relative flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-gradient-to-b hover:from-red-500/10 hover:to-transparent hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  {/* Avatar with Ambient Backlight Glow - NO harsh solid circle */}
                  <div className="relative w-18 h-18 sm:w-22 sm:h-22 flex items-center justify-center mb-1">
                    <div className="absolute inset-1 bg-red-600/25 rounded-full blur-xl group-hover:bg-red-500/40 transition-colors pointer-events-none" />
                    <img 
                      src="/dabour.webp" 
                      alt="دبور" 
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      width={88}
                      height={88}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 object-contain filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)] group-hover:scale-108 transition-transform duration-300 pointer-events-none" 
                    />
                    <span className="absolute bottom-1 right-2 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full shadow-sm"></span>
                  </div>

                  {/* Name & Identity */}
                  <span className="font-extrabold text-base text-white group-hover:text-red-400 transition-colors leading-tight">
                    دبور
                  </span>
                  <span className="text-[11px] font-bold text-red-400/90 mb-1.5">
                    (محمد) · صاحب المكان ☕
                  </span>

                  {/* Vibe Tagline */}
                  <span className="text-[10px] text-slate-300 bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-full mb-3 leading-tight">
                    مزاج القهوة والجيمنج 🔥
                  </span>

                  {/* Selection Button */}
                  <span className="w-full py-1.5 px-2 rounded-xl bg-red-600/20 group-hover:bg-red-600 border border-red-500/30 group-hover:border-red-500 text-red-300 group-hover:text-white font-bold text-xs transition-all shadow-sm">
                    اختيار دبور
                  </span>
                </motion.button>

                {/* 2. Abu Malaz Card */}
                <motion.button
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectPersona('abu_malaz')}
                  className="group relative flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-gradient-to-b hover:from-amber-500/10 hover:to-transparent hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  {/* Avatar with Ambient Backlight Glow - NO harsh solid circle */}
                  <div className="relative w-18 h-18 sm:w-22 sm:h-22 flex items-center justify-center mb-1">
                    <div className="absolute inset-1 bg-amber-500/25 rounded-full blur-xl group-hover:bg-amber-400/40 transition-colors pointer-events-none" />
                    <img 
                      src="/abu-malaz.webp" 
                      alt="أبو ملاذ" 
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      width={88}
                      height={88}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 object-contain filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)] group-hover:scale-108 transition-transform duration-300 pointer-events-none" 
                    />
                    <span className="absolute bottom-1 right-2 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full shadow-sm"></span>
                  </div>

                  {/* Name & Identity */}
                  <span className="font-extrabold text-base text-white group-hover:text-amber-400 transition-colors leading-tight">
                    أبو ملاذ
                  </span>
                  <span className="text-[11px] font-bold text-amber-400/90 mb-1.5">
                    (أحمد) · صاحب المكان ✨
                  </span>

                  {/* Vibe Tagline */}
                  <span className="text-[10px] text-slate-300 bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-full mb-3 leading-tight">
                    الترويق والضيافة الملكية 👑
                  </span>

                  {/* Selection Button */}
                  <span className="w-full py-1.5 px-2 rounded-xl bg-amber-600/20 group-hover:bg-amber-600 border border-amber-500/30 group-hover:border-amber-500 text-amber-300 group-hover:text-white font-bold text-xs transition-all shadow-sm">
                    اختيار أبو ملاذ
                  </span>
                </motion.button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Dedicated Chat Window (Focused on Selected Waiter Only) */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-auto sm:right-6 w-full sm:w-[460px] md:w-[480px] h-[88dvh] sm:h-[660px] sm:max-h-[85vh] z-50 bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/30 border border-slate-200/80 dark:border-slate-800/80 flex flex-col overflow-hidden"
          >
            {/* Header (100% Dedicated to Selected Waiter) */}
            <div className={`${currentPersona.headerBg} text-white px-4 py-3.5 sm:px-5 transition-all duration-300 shrink-0 shadow-md z-10 flex items-center justify-between`}>
              
              {/* Waiter Info */}
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-white/15 p-0.5 border-2 border-white/30 shadow-md">
                  <img src={currentPersona.avatar} alt={currentPersona.name} className="w-full h-full object-contain filter drop-shadow" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-1.5 leading-tight">
                    {currentPersona.name}
                    <span className="text-xs font-semibold opacity-90">({currentPersona.realName})</span>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  </h3>
                  <p className="text-white/80 text-[11px] font-medium">{currentPersona.badge}</p>
                </div>
              </div>

              {/* Action Buttons: The Two Avatar Marks Switcher & Close */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Switcher with the Two Marks ("ال علامتين اللي جوا الشات") */}
                <div className="flex items-center p-0.5 sm:p-1 bg-black/25 backdrop-blur-md rounded-full border border-white/20 shadow-inner">
                  {/* Mark 1: Dabour */}
                  <button
                    type="button"
                    onClick={() => handleSwitchToPersona('dabour')}
                    className={`group relative flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-bold transition-all ${
                      activePersona === 'dabour'
                        ? 'bg-red-600 text-white shadow-md ring-2 ring-white/70 scale-105'
                        : 'text-white/70 hover:text-white hover:bg-white/10 opacity-60 hover:opacity-100'
                    }`}
                    title="التبديل إلى دبور (محمد)"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden flex items-center justify-center bg-white/20">
                      <img src="/dabour.webp" alt="دبور" className="w-full h-full object-contain filter drop-shadow" />
                    </div>
                    <span className="text-[11px] hidden sm:inline">دبور</span>
                  </button>

                  {/* Mark 2: Abu Malaz */}
                  <button
                    type="button"
                    onClick={() => handleSwitchToPersona('abu_malaz')}
                    className={`group relative flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-bold transition-all ${
                      activePersona === 'abu_malaz'
                        ? 'bg-amber-600 text-white shadow-md ring-2 ring-white/70 scale-105'
                        : 'text-white/70 hover:text-white hover:bg-white/10 opacity-60 hover:opacity-100'
                    }`}
                    title="التبديل إلى أبو ملاذ (أحمد)"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden flex items-center justify-center bg-white/20">
                      <img src="/abu-malaz.webp" alt="أبو ملاذ" className="w-full h-full object-contain filter drop-shadow" />
                    </div>
                    <span className="text-[11px] hidden sm:inline">أبو ملاذ</span>
                  </button>
                </div>

                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
                  aria-label="إغلاق المحادثة"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
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
