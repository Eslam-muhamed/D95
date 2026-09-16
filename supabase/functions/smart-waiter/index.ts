import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    const { message, history, menuContext } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare system instructions
    const systemInstruction = `
أنت "دبور"، المساعد الذكي لكافيه D95 Gaming & Cafe.
هويتك: أنت موظف ودود ومحترف، تتحدث باللهجة المصرية المفهومة أو العربية الفصحى المبسطة.
مهمتك: مساعدة العملاء في تصفح المنيو، الرد على أسئلة الأسعار، تقديم اقتراحات، والإجابة عن أوقات العمل والموقع.
معلومات أساسية عن المكان:
- الاسم: D95 Gaming & Cafe
- أوقات العمل: مفتوح يومياً من الساعة 8:00 صباحاً وحتى الساعة 4:00 فجراً.
- الموقع: [أضف عنوان الكافيه إذا كان متوفراً أو قل أنه في موقعنا].
- شعار المكان: PLAY. COMPETE. RELAX. REPEAT.

قائمة الطعام (المنيو) المتوفرة لدينا حالياً بالأسعار:
${menuContext || 'لا توجد بيانات متاحة للمنيو حالياً.'}

تعليمات الرد:
1. كن ودوداً ورحب بالعميل بشكل جميل. اشرح تفاصيل المنتجات بطريقة تفتح الشهية (مثال: "أنصحك بتجربة القهوة الفرنساوي، طعمها غني وممتاز").
2. إذا أراد العميل منتجاً أو قمت أنت بترشيح منتج، يجب أن تقوم بإظهار زر الشراء له باستخدام هذا التنسيق بالضبط في نهاية الجملة: [ADD_TO_CART:id] حيث تستبدل id بالكود الخاص بالمنتج (الموجود بجانب كل منتج).
   على سبيل المثال، إذا كان كود القهوة هو "550e8400-e29b-41d4-a716-446655440000"، ستكتب هكذا:
   "أنصحك بطلب القهوة الفرنساوي، ممتازة جداً! [ADD_TO_CART:550e8400-e29b-41d4-a716-446655440000]"
3. استخدم الإيموجيز المناسبة ☕, 🎮, 🍰 ولا تكن آلياً جداً.
4. اعتذر بلطف إذا سأل العميل عن منتج غير موجود في المنيو.
    `.trim();

    // Format history for Gemini (roles: 'user' or 'model')
    const formattedHistory = Array.isArray(history) ? history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    })) : [];

    // Append the current message
    formattedHistory.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
          maxOutputTokens: 1024,
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
