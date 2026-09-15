import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, User, Sparkles, AlertCircle, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/stores/cartStore';

// We import items to pass as context
import { getCachedCategories, getCachedProducts } from '@/services/menuService';
import type { DBProduct } from '@/types/database';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function SmartWaiterBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'أهلاً بك في D95 🎮☕! أنا النادل الذكي، إزاي أقدر أساعدك وأرشحلك من المنيو النهارده؟'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addItem } = useCart();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
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

    const userText = input.trim();
    setInput('');
    
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      // Build history for context (excluding the very first welcome msg to save tokens, or include it)
      const historyToPass = messages.slice(1).map(m => ({ role: m.role, text: m.text }));
      const menuContext = generateMenuContext();

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('smart-waiter', {
        body: {
          message: userText,
          history: historyToPass,
          menuContext
        }
      });

      if (error) throw error;

      const replyText = data?.reply || 'عذراً، حصلت مشكلة في الرد.';
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: replyText };
      
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      console.error('Smart Waiter Error:', err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: 'عذراً، أواجه مشكلة في الاتصال حالياً 😔. برجاء المحاولة لاحقاً.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: DBProduct) => {
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
    // Add a small temporary confirmation message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'model',
      text: `تم إضافة ${product.name} للسلة بنجاح! 🛒`
    }]);
  };

  const renderMessageContent = (text: string) => {
    const parts = text.split(/(\[ADD_TO_CART:\d+\])/g);
    const products = getCachedProducts();

    return (
      <div className="flex flex-col gap-2">
        {parts.map((part, index) => {
          const match = part.match(/\[ADD_TO_CART:(\d+)\]/);
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
                    className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                    title="أضف للسلة"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              );
            }
            return null; // Don't render the raw tag if product not found
          }
          
          return part ? <span key={index} className="whitespace-pre-wrap">{part}</span> : null;
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 bg-red-600 hover:bg-red-700 text-white p-3 sm:p-4 rounded-full shadow-2xl shadow-red-600/40 cursor-pointer flex items-center gap-2 group transition-all duration-300"
            aria-label="النادل الذكي"
          >
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap font-bold text-sm">
              النادل الذكي
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-auto sm:right-6 sm:w-96 sm:h-[500px] h-[80vh] z-50 bg-white dark:bg-slate-900 sm:rounded-2xl shadow-2xl shadow-black/20 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-red-600 text-white p-4 flex items-center justify-between shrink-0 shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-red-600 rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    النادل الذكي
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  </h3>
                  <p className="text-[10px] text-white/80">يجيب على استفساراتك من المنيو</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="إغلاق المحادثة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900 scroll-smooth">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                >
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-red-600" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-red-600 text-white rounded-tl-none' 
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
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-red-600" />
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
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 text-[10px] text-center text-slate-500 border-t border-slate-100 dark:border-slate-800 flex justify-center items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>هذا المساعد مدعوم بالذكاء الاصطناعي وقد يُخطئ أحياناً</span>
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-500/20 transition-all"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="اسأل عن المنيو أو الأسعار..."
                  className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-900 dark:text-white outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
