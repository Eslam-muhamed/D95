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
      text: 'أهلاً بك في D95 ☕🎮! أنا دبور، إزاي أقدر أساعدك وأرشحلك من المنيو النهارده؟'
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
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-3"
          >
            <motion.button
              onClick={() => setIsOpen(true)}
              className="relative w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl hover:bg-red-700 transition-colors overflow-hidden border-4 border-red-500 hover:scale-105 active:scale-95"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="اسأل دبور"
            >
              <img src="/dabour.png" alt="دبور" className="w-full h-full object-cover" />
              {/* Online Indicator */}
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
            </motion.button>
            
            {/* Thought Bubble */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="relative flex bg-white text-slate-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-lg border border-slate-100 font-bold text-xs sm:text-sm whitespace-nowrap"
            >
              اسأل دبور 🐝
              {/* Bubble Arrow */}
              <div className="absolute top-1/2 -right-1.5 sm:-right-2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white border-r border-t border-slate-100 transform rotate-45"></div>
            </motion.div>
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
            className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-auto sm:right-6 sm:w-96 sm:h-[500px] h-[80vh] z-50 bg-white dark:bg-slate-900 sm:rounded-2xl shadow-2xl shadow-black/20 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-red-600 text-white p-4 flex items-center justify-between shrink-0 shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/20">
                    <img src="/dabour.png" alt="دبور" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      اسأل دبور <Sparkles className="w-4 h-4 text-yellow-300" />
                    </h3>
                    <p className="text-red-100 text-xs">يجيب على استفساراتك من المنيو</p>
                  </div>
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
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4 items-end gap-2`}
                >
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 bg-red-900/50 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img src="/dabour.png" alt="دبور" className="w-full h-full object-cover" />
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
