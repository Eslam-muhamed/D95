# D95 — Gaming Lounge & Specialty Café

منصة حجز صالات ألعاب البلايستيشن الفاخرة ومنيو الكافيه المتخصص لعلامة **D95**.

---

## 🎮 مميزات المشروع

- **بوابة دخول سينمائية**: تجربة بصرية تفاعلية بين عالم الجيمنج (PlayStation 5) وعالم الكافيه.
- **صالة الألعاب (PlayStation Rooms)**:
  - استعراض الغرف مع تفاصيل الشاشات والأجهزة والأنظمة الصوتية.
  - تجربة فتح الأبواب ثلاثية الأبعاد (3D Door Opening Transition) مع مؤثر صوتي حقيقي لتشغيل الـ PS5 (مبني بـ Web Audio API).
  - حجز فوري للمواعيد بالساعة، اختيار إضافات وسناكس، وحساب تلقائي للتكلفة.
  - خيارات دفع مرنة (إنستاباي فوري، كاش بالصالة، محفظة إلكترونية).
  - إصدار تذكرة صعود إلكترونية (VIP Boarding Pass) ومشاركتها مباشرة عبر واتساب.
- **منيو الكافيه المتخصص**:
  - تصنيف المشروبات الساخنة والباردة والإضافات.
  - تخصيص كامل للطلب (مستوى السكر، الثلج، شوت إضافي، كريمة، إضافات خاصة).
  - سلة مشتريات تفاعلية مع شريط تنقل سفلي سريع.
  - مؤثر صوتي ترحيبي لأكواب الكافيه عند دخول المنيو.
- **نظام المظهر المزدوج (Dark / Light Mode)**:
  - دعم كامل للـ Dark Mode المظلم والـ Light Mode الرياضي المستوحى من الخرسانة المضيئة والهوية الجريئة للمكان.
  - زر تبديل سلس مع حفظ التفضيل في `localStorage`.
- **تصميم متجاوب بالكامل**: متوافق 100% مع الهواتف الذكية والأجهزة اللوحية وشاشات الحواسب.

---

## 🛠️ التقنيات المستخدمة

- **Framework**: React 18 + Vite (SWC)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Vanilla CSS Tokens
- **State Management**: Zustand
- **Backend / Database**: Supabase
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Routing**: React Router DOM v6
- **Audio Engine**: Synthesized Web Audio API (No heavy external mp3 assets)

---

## 🚀 التشغيل محلياً

```bash
# تثبيت الحزم
npm install

# تشغيل السيرفر المحلي
npm run dev

# بناء النسخة الإنتاجية
npm run build
```

---

## 🔒 الإعدادات ومتغيرات البيئة (Environment Variables)

لضمان أمان المشروع، تم فصل متغيرات البيئة إلى قسمين: **متغيرات الواجهة الأمامية (Frontend)**، و **أسرار الخوادم الطرفية (Edge Functions)**.

### 1. متغيرات الواجهة الأمامية (العامة)
هذه المتغيرات يجب إضافتها في ملف `.env` في المسار الرئيسي للمشروع. وهي آمنة للعرض في المتصفح.

- `VITE_SUPABASE_URL`: رابط مشروع Supabase.
- `VITE_SUPABASE_ANON_KEY`: المفتاح العام (Publishable Key).
- `VITE_TURNSTILE_SITE_KEY`: مفتاح الموقع لخدمة Cloudflare Turnstile (مطلوب لحماية بوابة الدفع من البوتات).

⚠️ **تنبيه هام:** لا تقم أبداً بإضافة أي مفتاح سرّي (Secret Key) في ملف `.env`.

### 2. أسرار الخوادم الطرفية (Edge Function Secrets)
هذه المتغيرات تستخدم حصراً في الواجهة الخلفية (Backend) عبر وظائف Supabase Edge Functions. يجب حقنها مباشرة عبر واجهة سطر الأوامر (CLI) الخاصة بـ Supabase، ولا يجب إضافتها لأي ملف في الكود המصدري.

المتغيرات المطلوبة:
- `TURNSTILE_SECRET_KEY`: يستخدم للتحقق من مصداقية حجوزات العملاء.
- `GEMINI_API_KEY`: يستخدم لتشغيل مساعد الذكاء الاصطناعي "دبور" في المنيو.

**خطوات حقن المتغيرات:**
```bash
supabase secrets set TURNSTILE_SECRET_KEY=your_secret_key
supabase secrets set GEMINI_API_KEY=your_gemini_key
```

*ملاحظة:* المتغيرات `SUPABASE_URL`، `SUPABASE_ANON_KEY`، و `SUPABASE_SERVICE_ROLE_KEY` يتم توفيرها تلقائياً للخوادم الطرفية من قبل بيئة Supabase ولا تحتاج لإضافتها يدوياً.

---

## 🚀 النشر والتشغيل على خوادم الإنتاج (Deployment)

1. **الواجهة الأمامية (Vercel / Cloudflare Pages):**
   - قم بربط مستودع الكود وتأكد من إضافة المتغيرات الثلاثة (`VITE_...`) في إعدادات البيئة (Environment Variables).
   - المشروع معد مسبقاً في `vercel.json` لإضافة ترويسات الأمان (Security Headers) وتوجيه المسارات.

2. **الخوادم الطرفية (Supabase Edge Functions):**
   - لنشر وظائف الحجز والذكاء الاصطناعي، استخدم الأوامر التالية:
   ```bash
   supabase functions deploy create-booking
   supabase functions deploy smart-waiter
   ```
   - تأكد من حقن المفاتيح السرية كما هو موضح في قسم الإعدادات.
