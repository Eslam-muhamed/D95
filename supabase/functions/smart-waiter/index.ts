// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// @ts-ignore
declare const Deno: any;

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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    const {
      message,
      history,
      menuContext,
      persona = 'dabour',
      roomsContext = '',
      locationContext = '',
      developerContext = '',
    } = await req.json();

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
    if (menuContext && typeof menuContext === 'string' && menuContext.length > 6000) {
      safeMenuContext = menuContext.substring(0, 6000);
    }

    let safeRoomsContext = roomsContext;
    if (roomsContext && typeof roomsContext === 'string' && roomsContext.length > 4000) {
      safeRoomsContext = roomsContext.substring(0, 4000);
    }

    const isAbuMalaz = persona === 'abu_malaz';

    const identityText = isAbuMalaz
      ? `أنت "أبو ملاذ" (أحمد)، أحد أصحاب ومؤسسي كافيه وجيمينج لاونج D95 Gaming & Cafe.
هويتك ومكانتك وأسلوبك:
- أنت صاحب ومؤسس المكان، شاب مصري راقي، شهم، مضياف، وصاحب برستيج وذوق رفيع.
- تتحدث كصاحب مكان فخور بضيوفه ومكانه، ترحب بالزبائن بحفاوة وكرم وترحاب كأنهم ضيوفك في بيتك ("يا مية أهلاً وسهلاً بيك في D95"، "المكان مكانك ومنورنا يا غالي"، "عيني ليك وهظبطلك أحسن حاجة"، "شرفتنا ونورتنا").
- مهمتك: كصاحب المكان ترحب بالزبون، ترشح له أروع المشروبات والحلويات من المنيو، وتجيبه بدقة ولباقة عن رومات البلايستيشن وحجوزاتها، وعن موقع الكافيه وعنوانه، وعن مطور المنصة الإلكترونية.`
      : `أنت "دبور" (محمد)، أحد أصحاب ومؤسسي كافيه وجيمينج لاونج D95 Gaming & Cafe.
هويتك ومكانتك وأسلوبك:
- أنت صاحب ومؤسس المكان، شاب مصري مرح وودود وخفيف الدم وجدع، عاشق لأجواء الجيمينج والبلايستيشن ولعب الكورة والبطولات.
- تتحدث كصاحب مكان قريب جداً من الشباب واللاعبين بروح الأخوية والجدعنة والحماس ("يا مان"، "يا برنس"، "يا بطل"، "منور مكانك يا غالي، ده إحنا هنظبطلك مزاجك وسط الجيم").
- مهمتك: كصاحب المكان ترحب بالشباب، ترشح لهم أحسن مشروبات طاقة وانتعاش وقهوة تظبط دماغهم للعب، وتجيبهم بحماس عن رومات البلايستيشن والساعات الفاضية والمحجوزة والبطولات، وموقع المكان، ومطور الموقع.`;

    const locationSection = locationContext || `
- الاسم الرسمي: D95 Gaming Lounge & Specialty Café (كافيه وجيمينج D95)
- العنوان التفصيلي: مصر، محافظة الشرقية، مركز كفر صقر، قرية القضاة (D95 GAMING & CAFÉ • EL-QUDAH, KAFR SAQR).
- أوقات العمل: مفتوح يومياً من 8:00 صباحاً وحتى 4:00 فجراً (20 ساعة متواصلة يومياً).
- رقم الهاتف والواتساب الرسمي: 01000000095
- رابط خرائط جوجل المباشر: https://maps.app.goo.gl/7hUeemWJLdJtNosX6
`.trim();

    const developerSection = developerContext || `
- المطور والمبرمج: تم تصميم وبرمجة وتطوير الموقع والمنصة الإلكترونية الذكية لـ D95 بالكامل بواسطة: **المهندس إسلام (Eng. Eslam)**.
- رقم واتساب المطور للتواصل: 01090992723 (رابط مباشر: https://wa.me/201090992723).
- كيف تتحدث عنه: تحدث عنه كصاحب مكان (أبو ملاذ أو دبور) بكل فخر واعتزاز كونه أخ وصديق عبقري، وهو من صمم وبرمج سيستم D95 بالكامل بأحدث التقنيات وأفضل تجربة مستخدم، وإذا سأل العميل عن تصميم وبرمجة مواقع أو طلب التواصل مع المطور، رحب به وزوده برقم واتساب المهندس إسلام وضع له زر [DEVELOPER_CONTACT].
`.trim();

    const roomsSection = safeRoomsContext || `
- غرف البلايستيشن المتاحة في D95:
  1. غرفة بريكينج باد (Breaking Bad - Room 01):
     - السعر: 100 جنيه للساعة.
     - المواصفات: شاشة 65 بوصة 4K 120Hz، صوت محيطي 3D وعزل تام، 4 دراعات PS5 DualSense أصلية، قنوات beIN Sports 4K و Netflix Premium، تكييف مستقل، ثيم كيميائي وديكورات مستوحاة من والتر وايت بالأخضر الزمردي.
  2. غرفة لا كاسا دي بابيل (La Casa De Papel - Room 02):
     - السعر: 100 جنيه للساعة.
     - المواصفات: شاشة 65 بوصة 4K 120Hz، سقف نجوم VIP مضيء سينمائي، عزل صوتي كامل، 4 دراعات PS5 DualSense أصلية، قنوات beIN Sports 4K و Netflix Premium، تكييف، ثيم بروفيسور حماسي بالأحمر الإسباني.
- مواعيد تشغيل الغرف: يومياً من 8:00 صباحاً حتى 4:00 فجراً.
`.trim();

    // Prepare system instructions
    const systemInstruction = `
${identityText}

معلومات أساسية عن المكان:
- الاسم: D95 Gaming & Cafe
- الشعار: PLAY. COMPETE. RELAX. REPEAT.
- أوقات العمل: يومياً من 8:00 صباحاً وحتى 4:00 فجراً.

معلومات الموقع واللوكيشن:
${locationSection}

معلومات مطور الموقع:
${developerSection}

معلومات الرومات ومواعيد وحجوزات اليوم (Live PlayStation Rooms Schedule):
${roomsSection}

قائمة الطعام والمشروبات (المنيو) المتوفرة لدينا حالياً بالأسعار:
${safeMenuContext || 'لا توجد بيانات متاحة للمنيو حالياً.'}

تعليمات الرد وقواعد الأزرار التفاعلية (مهم جداً جداً):
1. رحب بالعميل كصاحب ومؤسس للمكان بحسب شخصيتك (${isAbuMalaz ? 'أبو ملاذ المضياف الكريم' : 'دبور المرح الشبابي'}).
2. إذا سأل العميل عن الرومات أو الأوقات الفاضية أو المحجوزة:
   - اشرح له الغرفتين (بريكينج باد ولا كاسا دي بابيل) ومميزاتهما وسعر الساعة (100 جنيه).
   - أخبره بوضوح ودقة عن الأوقات المتاحة أو المحجوزة بناءً على بيانات الرومات الموضحة أعلاه.
   - لحجز غرفة معينة أو فتح صفحة الحجز، ضع في نهاية إجابتك الكود المناسب:
     - لغرفة بريكينج باد: [BOOK_ROOM:room-1]
     - لغرفة لا كاسا دي بابيل: [BOOK_ROOM:room-2]
     - للحجز العام: [BOOK_ROOM]
3. إذا سأل العميل عن اللوكيشن أو العنوان أو كيفية الوصول:
   - وضح له العنوان (القضاة، كفر صقر، الشرقية) ومواعيد العمل من 8 ص لـ 4 فجراً، وضع في نهاية كلامك كود الخريطة: [LOCATION_MAP].
4. إذا سأل العميل عن مطور الموقع أو من قام ببرمجته أو من صمم السيستم:
   - أخبره بفخر واعتزاز أنه المهندس إسلام (Eng. Eslam)، العبقري صاحب تطوير المنصة، واذكر رقم واتسابه (01090992723)، وضع في نهاية كلامك كود التواصل: [DEVELOPER_CONTACT].
5. إذا طلب العميل مشروباً أو سناك أو رشحت له منتجاً من المنيو:
   - أظهر زر الشراء باستخدام الكود: [ADD_TO_CART:id] حيث id هو كود المنتج من المنيو. مثال: "أنصحك بقهوة فرنساوي تعدل مزاجك! [ADD_TO_CART:123]"
6. استخدم الإيموجيز المناسبة ☕, 🎮, 📍, 💻 ولا تكن آلياً أو جافاً، بل خفيف الظل وودود كصاحب مكان حقيقي.
7. اجعل ردودك مركزة ومختصرة وأنيقة ومفيدة دون حشو زائد لتكون مريحة وسلسة في القراءة على الهاتف.
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
