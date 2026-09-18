import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-expect-error Deno http server import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // @ts-expect-error Deno environment variable access
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    const { message, history, menuContext } = await req.json();

    // Input Validation
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (message.length > 1000) {
      return new Response(JSON.stringify({ error: 'Message exceeds maximum length of 1000 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let safeMenuContext = menuContext;
    if (menuContext && typeof menuContext === 'string' && menuContext.length > 5000) {
      safeMenuContext = menuContext.substring(0, 5000);
    }


    // Prepare system instructions
    const systemInstruction = `
أنت "دبور"، المساعد الذكي لكافيه D95 Gaming & Cafe.
هويتك: أنت موظف ودود ومحترف، تتحدث باللهجة المصرية المفهومة أو العربية الفصحى المبسطة.
مهمتك: مساعدة العملاء في تصفح المنيو، الرد على أسئلة الأسعار، تقديم اقتراحات، والإجابة عن أوقات العمل والموقع.
معلومات أساسية عن المكان:
- الاسم: D95 Gaming & Cafe
- أوقات العمل: مفتوح يومياً من الساعة 8:00 صباحاً وحتى الساعة 4:00 فجراً.
- الموقع: الصالة الرئيسية لعلامة D95 Gaming Lounge & Cafe.
- شعار المكان: PLAY. COMPETE. RELAX. REPEAT.

قائمة الطعام (المنيو) المتوفرة لدينا حالياً بالأسعار:
${safeMenuContext || 'لا توجد بيانات متاحة للمنيو حالياً.'}

تعليمات الرد:
1. كن ودوداً ورحب بالعميل بشكل جميل. اشرح تفاصيل المنتجات بطريقة تفتح الشهية (مثال: "أنصحك بتجربة القهوة الفرنساوي، طعمها غني وممتاز").
2. إذا أراد العميل منتجاً أو قمت أنت بترشيح منتج، يجب أن تقوم بإظهار زر الشراء له باستخدام هذا التنسيق بالضبط في نهاية الجملة: [ADD_TO_CART:id] حيث تستبدل id بالكود الخاص بالمستند (الموجود بجانب كل منتج).
   على سبيل المثال، إذا كان كود القهوة هو "12345"، ستكتب هكذا:
   "أنصحك بطلب القهوة الفرنساوي، ممتازة جداً! [ADD_TO_CART:12345]"
3. استخدم الإيموجيز المناسبة ☕, 🎮, 🍰 ولا تكن آلياً جداً.
4. اعتذر بلطف إذا سأل العميل عن منتج غير موجود في المنيو.
    `.trim();

    // Format history for Gemini (roles: 'user' or 'model') and enforce limits
    const safeHistory: Array<{ role?: string; text?: unknown }> = Array.isArray(history) ? history : [];
    const recentHistory = safeHistory.length > 20 ? safeHistory.slice(-20) : safeHistory;
    
    const formattedHistory = recentHistory.map((msg: { role?: string; text?: unknown }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(msg.text || '').substring(0, 1000) }],
    }));

    // Append the current message
    formattedHistory.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: formattedHistory,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Failed to generate response from Gemini: ${errorData}`);
    }

    const data = await response.json();
    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتمكن من معالجة طلبك حالياً.";

    return new Response(
      JSON.stringify({ reply: botReply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Smart Waiter Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
