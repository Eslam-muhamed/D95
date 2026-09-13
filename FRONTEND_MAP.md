# 🗺️ خريطة فرونت إند مشروع D95 (Frontend Architecture & UI Map)

> **دليل شامل لجميع واجهات ومكونات وأزرار المشروع**  
> تم إعداد هذا الملف ليكون مرجعك السريع والمباشر لمعرفة مكان أي زر أو ميزة أو شاشة داخل الكود، حتى تتمكن من تحديد ما تريد تعديله بدقة فائقة.

---

## 📑 الفهرس السريع (Quick Navigation)
1. [جدول البحث السريع: "عايز أعدل كذا ⬅️ روح لملف كذا"](#-جدول-البحث-السريع-عايز-أعدل-كذا--روح-لملف-كذا)
2. [هيكلية المجلدات الرئيسية (`src`)](#-هيكلية-المجلدات-الرئيسية-src)
3. [خرائط الصفحات والراوتس (Pages & Routes)](#-خرائط-الصفحات-والراوتس-pages--routes)
4. [مكونات الواجهة المشتركة والميزات (Features & Components)](#-مكونات-الواجهة-المشتركة-والميزات-features--components)
5. [مكونات لوحة تحكم الإدارة (Admin Dashboard Components)](#-مكونات-لوحة-تحكم-الإدارة-admin-dashboard-components)
6. [إدارة الحالة العامة (Global Stores & State)](#-إدارة-الحالة-العامة-global-stores--state)
7. [البيانات الثابتة ونصوص النظام (Constants)](#-البيانات-الثابتة-ونصوص-النظام-constants)
8. [التنسيقات والألوان والخطوط (Styling & Theming)](#-التنسيقات-والألوان-والخطوط-styling--theming)
9. [طريقة طلب التعديل بدقة (Best Prompting Practice)](#-طريقة-طلب-التعديل-بدقة)

---

## ⚡ جدول البحث السريع: "عايز أعدل كذا ⬅️ روح لملف كذا"

| ما تريد تعديله | المسار المباشر للملف |
| :--- | :--- |
| **أرقام التليفون، الواتساب، المحافظ، إنستاباي الافتراضية** | [`src/constants/contactInfo.ts`](file:///Users/jrslam/D95/src/constants/contactInfo.ts) |
| **أصناف المنيو الثابتة (الأسعار، الصور، الأسماء، الأوصاف)** | [`src/constants/menuData.ts`](file:///Users/jrslam/D95/src/constants/menuData.ts) أو [`hotItems.ts`](file:///Users/jrslam/D95/src/constants/hotItems.ts) أو [`coldItems.ts`](file:///Users/jrslam/D95/src/constants/coldItems.ts) |
| **الصفحة الافتتاحية (البوابة - الدخول للبلايستيشن أو الكافيه)** | [`src/pages/GatewayPage.tsx`](file:///Users/jrslam/D95/src/pages/GatewayPage.tsx) |
| **صفحة البلايستيشن والغرف وعرض المواصفات والأسعار** | [`src/pages/PlaystationPage.tsx`](file:///Users/jrslam/D95/src/pages/PlaystationPage.tsx) |
| **خطوة حجز الغرفة (تحديد اليوم، عجلة الوقت، الساعات)** | [`src/pages/BookingDetailsPage.tsx`](file:///Users/jrslam/D95/src/pages/BookingDetailsPage.tsx) |
| **شريط التايم لاين والمواعيد المحجوزة والمتاحة** | [`src/components/booking/BookingTimelineSchedule.tsx`](file:///Users/jrslam/D95/src/components/booking/BookingTimelineSchedule.tsx) |
| **صفحة الدفع (بيانات العميل، فودافون كاش، كود USSD، إنستاباي)** | [`src/pages/BookingPaymentPage.tsx`](file:///Users/jrslam/D95/src/pages/BookingPaymentPage.tsx) |
| **تذكرة الحجز والباركود وزر إرسال الحجز واتساب** | [`src/pages/BookingSuccessPage.tsx`](file:///Users/jrslam/D95/src/pages/BookingSuccessPage.tsx) |
| **صفحة المنيو وتصفح المشروبات والحلويات** | [`src/pages/MenuPage.tsx`](file:///Users/jrslam/D95/src/pages/MenuPage.tsx) |
| **شريط التنقل السفلي الثابت في الموبايل (Bottom Bar)** | [`src/components/layout/BottomNav.tsx`](file:///Users/jrslam/D95/src/components/layout/BottomNav.tsx) |
| **الهيدر العلوي لصفحة المنيو (زر الصوت، الثيم، السلة)** | [`src/components/features/TopHeader.tsx`](file:///Users/jrslam/D95/src/components/features/TopHeader.tsx) |
| **سلة المشتريات المنبثقة من الأسفل/الجانب والويتر** | [`src/components/features/CartSheet.tsx`](file:///Users/jrslam/D95/src/components/features/CartSheet.tsx) |
| **نافذة تخصيص المشروب (السكر، الثلج، الإضافات، الملاحظات)** | [`src/components/features/ItemCustomizerModal.tsx`](file:///Users/jrslam/D95/src/components/features/ItemCustomizerModal.tsx) |
| **كرت الصنف في المنيو وزر (أضف +)** | [`src/components/features/MenuCard.tsx`](file:///Users/jrslam/D95/src/components/features/MenuCard.tsx) |
| **شريط الأقسام السريع (مشروبات ساخنة، ساقعة، موهيتو...)** | [`src/components/features/CategoryNav.tsx`](file:///Users/jrslam/D95/src/components/features/CategoryNav.tsx) |
| **قسم العروض وبانرات الخصومات وساعة السعادة** | [`src/components/features/OffersSection.tsx`](file:///Users/jrslam/D95/src/components/features/OffersSection.tsx) |
| **قسم آراء العملاء وتقييمات جوجل** | [`src/components/features/ReviewsSection.tsx`](file:///Users/jrslam/D95/src/components/features/ReviewsSection.tsx) |
| **قسم التواصل، العنوان، الفوتر السفلي** | [`src/components/features/ContactSection.tsx`](file:///Users/jrslam/D95/src/components/features/ContactSection.tsx) و [`Footer.tsx`](file:///Users/jrslam/D95/src/components/layout/Footer.tsx) |
| **شعار D95 بالفرشاة والأنيميشن** | [`src/components/brand/D95BrushLogo.tsx`](file:///Users/jrslam/D95/src/components/brand/D95BrushLogo.tsx) |
| **لوحة تحكم الإدارة (التابات الرئيسية والصلاحيات)** | [`src/pages/admin/AdminDashboardPage.tsx`](file:///Users/jrslam/D95/src/pages/admin/AdminDashboardPage.tsx) |
| **شاشة إدارة حجوزات البلايستيشن والكالندر في لوحة التحكم** | [`src/components/admin/SimpleOperationsTab.tsx`](file:///Users/jrslam/D95/src/components/admin/SimpleOperationsTab.tsx) |
| **شاشة طلبات الكافيه ومتابعة الحالات في لوحة التحكم** | [`src/components/admin/OrdersTab.tsx`](file:///Users/jrslam/D95/src/components/admin/OrdersTab.tsx) |
| **شاشة تعديل أصناف المنيو وأسعارها من لوحة التحكم** | [`src/components/admin/SimpleMenuSettingsTab.tsx`](file:///Users/jrslam/D95/src/components/admin/SimpleMenuSettingsTab.tsx) |
| **شاشة تعديل أرقام المحافظ وإنستاباي من لوحة التحكم** | [`src/components/admin/PaymentSettingsTab.tsx`](file:///Users/jrslam/D95/src/components/admin/PaymentSettingsTab.tsx) |
| **ألوان النظام، المتغيرات، الخطوط، خلفية الحائط الكونكريت** | [`src/index.css`](file:///Users/jrslam/D95/src/index.css) و [`tailwind.config.ts`](file:///Users/jrslam/D95/tailwind.config.ts) |
| **المؤثرات الصوتية (صوت PS5، صوت الكافيه، صوت السلة)** | [`src/lib/sound.ts`](file:///Users/jrslam/D95/src/lib/sound.ts) |

---

## 📂 هيكلية المجلدات الرئيسية (`src`)

```text
src/
├── App.tsx                     # الراوتر العام، توزيع المسارات، وموفرات الحالة (Providers)
├── main.tsx                    # نقطة الانطلاق لتطبيق React
├── index.css                   # التنسيقات العامة، المتغيرات اللونية للوضع النهاري والليلي
│
├── pages/                      # صفحات التطبيق (كل صفحة تمثل مسار / رابط)
│   ├── GatewayPage.tsx         # الرابط "/" (البوابة الافتتاحية)
│   ├── PlaystationPage.tsx     # الرابط "/playstation" (عرض الغرف والأسعار)
│   ├── BookingDetailsPage.tsx  # الرابط "/playstation/booking" (اختيار الميعاد والمدة)
│   ├── BookingPaymentPage.tsx  # الرابط "/playstation/payment" (الدفع وتأكيد الحجز)
│   ├── BookingSuccessPage.tsx  # الرابط "/playstation/success" (التذكرة وتأكيد الواتساب)
│   ├── MenuPage.tsx            # الرابط "/menu" (منيو الكافيه الرقمي)
│   └── admin/
│       ├── AdminLoginPage.tsx      # الرابط "/admin/login" (تسجيل دخول الإدارة)
│       └── AdminDashboardPage.tsx  # الرابط "/admin" (لوحة التحكم الشاملة)
│
├── components/                 # جميع عناصر ومكونات الواجهة
│   ├── layout/                 # مكونات الإطار العام
│   │   ├── BottomNav.tsx       # شريط التنقل السفلي (موبايل)
│   │   └── Footer.tsx          # التذييل السفلي وحقوق النشر
│   ├── brand/                  # هوية العلامة التجارية
│   │   └── D95BrushLogo.tsx    # لوجو D95 بالفرشاة
│   ├── booking/                # مكونات خاصة بنظام الحجز
│   │   └── BookingTimelineSchedule.tsx # التايم لاين التفاعلي للمواعيد
│   ├── features/               # ميزات وواجهات الكافيه والمنيو
│   │   ├── TopHeader.tsx       # الهيدر العلوي لصفحة المنيو
│   │   ├── CategoryNav.tsx     # شريط تصنيفات المنيو الأفقي
│   │   ├── SearchBar.tsx       # شريط البحث عن صنف
│   │   ├── MenuSection.tsx     # سيكشن التصنيف مع كروت الأصناف
│   │   ├── MenuCard.tsx        # كرت الصنف الفردي وزر الإضافة
│   │   ├── ItemCustomizerModal.tsx # مودال تخصيص الإضافات والملاحظات
│   │   ├── CartSheet.tsx       # سلة المشتريات التفاعلية المنبثقة
│   │   ├── OffersSection.tsx   # قسم العروض الترويجية
│   │   ├── ReviewsSection.tsx  # قسم تقييمات العملاء
│   │   ├── ContactSection.tsx  # قسم بيانات التواصل
│   │   ├── CategoryIcon.tsx    # أيقونات الأقسام
│   │   ├── SplashScreen.tsx    # شاشة التحميل الافتتاحية
│   │   └── ErrorBoundary.tsx   # التقاط الأخطاء البرمجية
│   └── admin/                  # مكونات لوحة الإدارة
│       ├── AdminProtectedRoute.tsx   # فحص صلاحية تسجيل الدخول
│       ├── SimpleOperationsTab.tsx   # تبويب الحجوزات والتشغيل اليومي
│       ├── OrdersTab.tsx             # تبويب طلبات الكافيه
│       ├── SimpleMenuSettingsTab.tsx # تبويب إعدادات المنيو والأصناف
│       ├── PaymentSettingsTab.tsx    # تبويب أرقام المحافظ وإنستاباي
│       ├── ProductModal.tsx          # نافذة إضافة/تعديل صنف
│       ├── CategoryModal.tsx         # نافذة إضافة/تعديل قسم
│       ├── OfferModal.tsx            # نافذة إضافة/تعديل عرض ترويجي
│       ├── BookingDetailsModal.tsx   # نافذة تفاصيل حجز وتعديل بياناته
│       └── AdminCalendarPopover.tsx  # كالندر التاريخ المنبثق للآدمن
│
├── stores/                     # إدارة الحالة العامة (State Management)
│   ├── cartStore.tsx           # سلة المشتريات والطلبات والحجز
│   └── themeStore.tsx          # تبديل الوضع الليلي / النهاري
│
├── services/                   # الاتصال بقاعدة البيانات والـ API
│   ├── bookingService.ts       # عمليات الحجز وتفقد الأوقات المتاحة
│   ├── menuService.ts          # جلب وإضافة الأصناف والأقسام
│   ├── orderService.ts         # إرسال طلبات الكافيه ومتابعتها
│   └── paymentSettingsService.ts # جلب وتحديث أرقام الدفع وأسعار الغرف
│
├── lib/                        # الدوال المساعدة والخدمية
│   ├── bookingDatetime.ts      # منطق توقيت القاهرة وحساب فترات العمل
│   ├── cartUtils.ts            # حساب أسعار الأصناف والإضافات
│   ├── sound.ts                # تشغيل وكتم المؤثرات الصوتية
│   ├── supabase.ts             # إعداد عميل Supabase
│   └── utils.ts                # دمج فئات Tailwind (clsx / twMerge)
│
└── constants/                  # الثوابت والبيانات الافتراضية
    ├── contactInfo.ts          # معلومات التواصل والروابط
    ├── menuMetadata.ts         # أقسام المنيو وأيقوناتها
    ├── menuData.ts             # بيانات جميع الأصناف الافتراضية
    ├── hotItems.ts             # أصناف المشروبات الساخنة
    ├── coldItems.ts            # أصناف المشروبات الباردة
    └── itemCustomizations.ts   # خيارات التخصيص لكل فئة
```

---

## 🖥️ خرائط الصفحات والراوتس (Pages & Routes)

### 1. صفحة البوابة (Gateway Portal)
* **المسار في المتصفح**: `/`
* **الملف المسئول**: [`src/pages/GatewayPage.tsx`](file:///Users/jrslam/D95/src/pages/GatewayPage.tsx)
* **ماذا يوجد داخل هذه الصفحة؟**:
  1. **شريط الإضاءة والتحكم العلوي**:
     - شارة النيون: `D95 GATEWAY`
     - زر تبديل الثيم (نهاري/ليلي) مع أيقونة الشمس والقمر.
  2. **الهيدر الرئيسي**:
     - شارة الحالة: `مفتوح الآن • OFFICIAL PORTAL`
     - لوجو الفرشاة [`D95BrushLogo`](file:///Users/jrslam/D95/src/components/brand/D95BrushLogo.tsx).
     - عنوان ضخم بتأثير Bebas: `WE ARE OPEN`.
     - بوكس ساعات العمل: `FROM 08:00 AM TO 04:00 AM`.
     - الشعار: `PLAY • COMPETE • RELAX • REPEAT`.
  3. **البوابتان التفاعليتان (Dual Portals)**:
     - **بوابة البلايستيشن (ZONE 01 - PS5 ARENA)**:
       - زر/كرت ينقلك إلى `/playstation`، مع تشغيل صوت إقلاع الـ PS5 (`playPs5StartupSound`).
       - الزر السفلي داخل الكرت: `STARTING...` / `دخول الصالة`.
     - **بوابة الكافيه (ZONE 02 - CAFÉ BAR)**:
       - زر/كرت ينقلك إلى `/menu`، مع تشغيل صوت دخول الكافيه (`playCafeEntranceSound`).
       - الزر السفلي داخل الكرت: `OPENING...` / `تصفح المنيو`.
  4. **الفوتر السفلي**: رسالة شكر `THANK YOU & ENJOY YOUR TIME!`.

---

### 2. صفحة صالة الألعاب والغرف (Playstation Lounge)
* **المسار في المتصفح**: `/playstation`
* **الملف المسئول**: [`src/pages/PlaystationPage.tsx`](file:///Users/jrslam/D95/src/pages/PlaystationPage.tsx)
* **ماذا يوجد داخل هذه الصفحة؟**:
  1. **الهيدر العلوي الثابت**:
     - زر الرجوع إلى البوابة الرئيسية (`/`).
     - شعار D95 وBadge `GAMING LOUNGE`.
     - روابط التبديل السريع بين البوابة، صالة الألعاب، ومنيو الكافيه (في الشاشات المتوسطة والأكبر).
     - زر تبديل الوضع النهاري / الليلي.
     - زر السلة مع عداد المشتريات.
  2. **عنوان الصفحة**: `CHOOSE YOUR GAMING ROOM` مع نبذة عن مواصفات الغرف.
  3. **بوابات الغرف الخاصة VIP (Room 01 & Room 02)**:
     - **غرفة 01 (The Arena - غرفة الأبطال)**:
       - الصورة الداخلية: [`room-01-interior.jpg`](file:///Users/jrslam/D95/src/assets/doors/room-01-interior.jpg).
       - شارة التوفر الحية (متاح للحجز الآن).
       - المواصفات السريعة: شاشة 65" 4K، 4 دراعات، صوت 3D، تكييف VIP.
       - السعر بالساعة (مأخوذ ديناميكياً من Supabase).
       - زر **"احجز الآن"**: ينقلك مباشرة إلى صفحة `/playstation/booking` حاملاً بيانات الغرفة.
     - **غرفة 02 (VIP Suite - غرفة النجوم)**:
       - الصورة الداخلية: [`room-02-interior.jpg`](file:///Users/jrslam/D95/src/assets/doors/room-02-interior.jpg).
       - التنسيقات النيونية باللون الوردي المضيء (Rose Neon).
       - زر **"احجز الآن"**.
  4. **قسم الصالة المفتوحة والبلياردو (Walk-in items)**:
     - بلايستيشن الصالة المفتوحة (سعر الساعة).
     - طاولة بلياردو احترافية (سعر الجيم).
     - عند الضغط يظهر إشعار توضيحي (Toast) بأنها متاحة مباشرة عند الحضور بالفرع.
  5. **مميزات وتجهيزات المكان (Venue Amenities)**:
     - إنترنت فايبر فائق السرعة، أحدث مكتبة ألعاب 2026، ضيافة الكافيه حتى الغرفة، نظافة وتعقيم.
  6. **شريط مواعيد العمل والفوتر**.

---

### 3. صفحة تفاصيل موعد الحجز (Booking Details)
* **المسار في المتصفح**: `/playstation/booking`
* **الملف المسئول**: [`src/pages/BookingDetailsPage.tsx`](file:///Users/jrslam/D95/src/pages/BookingDetailsPage.tsx)
* **ماذا يوجد داخل هذه الصفحة؟**:
  1. **مبدل الغرف (Room Selector)**:
     - التبديل السلس بين غرفة 01 وغرفة 02 دون الرجوع للخلف.
  2. **محدد تاريخ الحجز (Date Picker)**:
     - شريط الأيام السريع للأيام القادمة.
     - زر فتح الكالندر الشهري الكامل.
  3. **عجلة الوقت الدوارة (Drum Wheel Time Picker)**:
     - مكون [`DrumWheelColumn`](file:///Users/jrslam/D95/src/pages/BookingDetailsPage.tsx#L136): اختيار الساعة، الدقيقة، والفترة (صباحاً / مساءً).
     - متطابق بدقة مع توقيت القاهرة وساعات عمل المكان (من 08:00 ص حتى 04:00 فجراً).
  4. **محدد مدة اللعب (Duration Selector)**:
     - أزرار اختيار الساعات: `1 h`, `2 h`, `3 h`, `4 h`, `5 h`, `6 h`.
  5. **الجدول الزمني التفاعلي ([`BookingTimelineSchedule`](file:///Users/jrslam/D95/src/components/booking/BookingTimelineSchedule.tsx))**:
     - رسم بياني حي لمواعيد اليوم، يعرض الفترات المحجوزة بالأحمر والمتاحة بالأخضر، ويحدد الفترة المختارة بالنيون.
     - فحص فوري للتعارض ومنع الحجز المزدوج.
  6. **إضافة مشروبات وسناكس من الكافيه داخل الجلسة (Optional Cafe Add-ons)**:
     - اختيار مشروبات سريعة مسبقاً لتكون جاهزة فور الوصول.
  7. **ملخص التكلفة وزر المتابعة**:
     - إجمالي حجز الغرفة + إجمالي المشروبات = الإجمالي الكلي.
     - زر **"المتابعة لتأكيد الحجز والدفع"**: ينقلك إلى `/playstation/payment`.

---

### 4. صفحة الدفع وتأكيد الحجز (Booking Payment)
* **المسار في المتصفح**: `/playstation/payment`
* **الملف المسئول**: [`src/pages/BookingPaymentPage.tsx`](file:///Users/jrslam/D95/src/pages/BookingPaymentPage.tsx)
* **ماذا يوجد داخل هذه الصفحة؟**:
  1. **ملخص بيانات الحجز**: اسم الغرفة، التاريخ، وقت البدء والانتهاء، والمدة.
  2. **حقول بيانات العميل**:
     - حقل "الاسم الكريم بالكامل" (مطلوب).
     - حقل "رقم الهاتف المحمول" (مطلوب - يدعم الأرقام المصرية 010, 011, 012, 015).
     - حقل "ملاحظات إضافية" (اختياري).
  3. **خيارات الدفع (Payment Method Tabs)**:
     - **إنستاباي (InstaPay)**:
       - عرض معرف إنستاباي.
       - زر نسخ المعرف بنقرة واحدة.
       - زر فتح تطبيق إنستاباي المباشر (إن وجد رابط).
     - **المحفظة الإلكترونية (فودافون كاش / اتصالات / أورنج / وي)**:
       - عرض رقم المحفظة المعتمد.
       - زر نسخ الرقم.
       - زر الاتصال بكود التحويل السريع USSD: `*9*7*الرقم*المبلغ#`.
     - **كاش بالفرع عند الوصول**:
       - إمكانية الدفع نقداً عند الحضور.
  4. **زر التأكيد النهائي**:
     - زر **"تأكيد الحجز الآن 🎮"**: يقوم بإنشاء الحجز في Supabase، وحفظ التذكرة، ونقلك تلقائياً إلى `/playstation/success`.

---

### 5. صفحة تذكرة الحجز والنجاح (Booking Success Page)
* **المسار في المتصفح**: `/playstation/success`
* **الملف المسئول**: [`src/pages/BookingSuccessPage.tsx`](file:///Users/jrslam/D95/src/pages/BookingSuccessPage.tsx)
* **ماذا يوجد داخل هذه الصفحة؟**:
  1. **شارات النجاح**: أيقونة التأكيد `تم تسجيل طلب حجزك بنجاح!`.
  2. **كارت التذكرة الرقمية (VIP Pass Ticket)**:
     - رقم الحجز الفريد (Reservation ID) مثل: `D95-PS-AB12-3456`.
     - اسم الغرفة، التاريخ، الوقت، والمدة.
     - كود الـ QR والباركود المميز.
     - اسم العميل ورقم هاتفه.
     - إجمالي المبلغ وحالة الدفع.
  3. **الأزرار التفاعلية**:
     - زر **"إرسال تفاصيل الحجز عبر واتساب"**: يفتح محادثة واتساب الرسمية مع تفاصيل الحجز منسقة ومجهزة للإرسال.
     - زر **"حفظ التذكرة / مشاركة"**.
     - زر **"الرجوع للرئيسية"**.

---

### 6. صفحة قائمة الكافيه (Digital Café Menu)
* **المسار في المتصفح**: `/menu`
* **الملف المسئول**: [`src/pages/MenuPage.tsx`](file:///Users/jrslam/D95/src/pages/MenuPage.tsx)
* **ماذا يوجد داخل هذه الصفحة؟**:
  1. الهيدر العلوي [`TopHeader`](file:///Users/jrslam/D95/src/components/features/TopHeader.tsx): كتم الصوت، تبديل الثيم، زر السلة.
  2. عنوان القائمة: `قائمة المشروبات والحلويات` وحالة العمل 24/7.
  3. شريط تصفح الأقسام الأفقي [`CategoryNav`](file:///Users/jrslam/D95/src/components/features/CategoryNav.tsx).
  4. شريط البحث السريع [`SearchBar`](file:///Users/jrslam/D95/src/components/features/SearchBar.tsx).
  5. قسم العروض الخاصة [`OffersSection`](file:///Users/jrslam/D95/src/components/features/OffersSection.tsx).
  6. أقسام الأصناف [`MenuSection`](file:///Users/jrslam/D95/src/components/features/MenuSection.tsx) وكروت الأصناف [`MenuCard`](file:///Users/jrslam/D95/src/components/features/MenuCard.tsx).
  7. قسم آراء العملاء [`ReviewsSection`](file:///Users/jrslam/D95/src/components/features/ReviewsSection.tsx).
  8. قسم التواصل والخريطة [`ContactSection`](file:///Users/jrslam/D95/src/components/features/ContactSection.tsx).
  9. الفوتر [`Footer`](file:///Users/jrslam/D95/src/components/layout/Footer.tsx).
  10. زر العودة للأعلى المستقل Floating Scroll to Top (`ScrollToTop`).
  11. نافذة تخصيص الصنف [`ItemCustomizerModal`](file:///Users/jrslam/D95/src/components/features/ItemCustomizerModal.tsx).

---

### 7. صفحة تسجيل دخول الإدارة (Admin Login)
* **المسار في المتصفح**: `/admin/login`
* **الملف المسئول**: [`src/pages/admin/AdminLoginPage.tsx`](file:///Users/jrslam/D95/src/pages/admin/AdminLoginPage.tsx)
* **ماذا يوجد داخل هذه الصفحة؟**:
  - نموذج تسجيل الدخول (البريد الإلكتروني + كلمة المرور).
  - متصل بحسابات Supabase Auth الرسمية (`admin@d95.com` و `cashier@d95.com`).
  - معالجة أخطاء الدخول وتأمين الوصول.

---

### 8. صفحة لوحة تحكم الإدارة (Admin Dashboard)
* **المسار في المتصفح**: `/admin`
* **الملف المسئول**: [`src/pages/admin/AdminDashboardPage.tsx`](file:///Users/jrslam/D95/src/pages/admin/AdminDashboardPage.tsx)
* **ماذا يوجد داخل هذه الصفحة؟**:
  - شريط تنقل التبويبات العلوي:
    1. **الحجوزات والتشغيل** ⬅️ [`SimpleOperationsTab.tsx`](file:///Users/jrslam/D95/src/components/admin/SimpleOperationsTab.tsx)
    2. **طلبات الكافيه** (مع شارة عدد الطلبات المعلقة) ⬅️ [`OrdersTab.tsx`](file:///Users/jrslam/D95/src/components/admin/OrdersTab.tsx)
    3. **منيو وأسعار الكافيه** (خاص بالآدمن) ⬅️ [`SimpleMenuSettingsTab.tsx`](file:///Users/jrslam/D95/src/components/admin/SimpleMenuSettingsTab.tsx)
    4. **إعدادات الدفع والمحافظ** (خاص بالآدمن) ⬅️ [`PaymentSettingsTab.tsx`](file:///Users/jrslam/D95/src/components/admin/PaymentSettingsTab.tsx)
  - زر تسجيل الخروج `LogOut`.
  - التحقق التلقائي من الصلاحيات وحماية التبويبات للكاشير.

---

## 🧩 مكونات الواجهة المشتركة والميزات (Features & Components)

### 1. سلة التسوق المنبثقة (Cart Sheet)
* **الملف المسئول**: [`src/components/features/CartSheet.tsx`](file:///Users/jrslam/D95/src/components/features/CartSheet.tsx)
* **ما تحتويه وكيف تعدلها**:
  - **تبويبات السلة**: تبويب طلبات الكافيه (`طلبات الكافيه`) وتبويب حجز البلايستيشن (`حجز البلايستيشن`).
  - **عناصر الصنف**: زيادة الكمية `+`، إنقاص الكمية `-`، حذف الصنف تماماً `Trash`.
  - **عرض التخصيصات**: مستوى السكر، درجة الثلج، الإضافات، والملاحظات الخاصة.
  - **حاسبة تقسيم الفاتورة (Bill Splitter)**: لتقسيم الحساب على عدد الأفراد.
  - **زر "إتمام الطلب مع الويتر" أو "إرسال الطلب عبر واتساب"**:
    - اختيار نوع الطلب (داخل الصالة مع رقم الطاولة / دليفري أو استلام مع الاسم ورقم الهاتف والعنوان).
    - اختيار طريقة الدفع (محفظة إلكترونية / إنستاباي / كاش).
    - زر إرسال الطلب وحفظه في Supabase.

---

### 2. شريط التنقل السفلي للموبايل (Bottom Navigation)
* **الملف المسئول**: [`src/components/layout/BottomNav.tsx`](file:///Users/jrslam/D95/src/components/layout/BottomNav.tsx)
* **الأزرار الموجودة فيه**:
  1. زر **البوابة**: ينقلك للمسار `/`.
  2. زر **الأجهزة**: ينقلك لمسار البلايستيشن `/playstation`.
  3. زر **الكافيه**: ينقلك لمسار المنيو `/menu`.
  4. زر **السلة**: يفتح سلة المشتريات المنبثقة مباشرة ويعرض عداد الأصناف الحية.
* **ملاحظة ذكية**: يختفي هذا الشريط تلقائياً في شاشات الحجز والدفع (`/playstation/booking`, `/payment`, `/success`) وفي البوابة لمنع التشويش.

---

### 3. شريط التنقل بين التصنيفات (Category Nav)
* **الملف المسئول**: [`src/components/features/CategoryNav.tsx`](file:///Users/jrslam/D95/src/components/features/CategoryNav.tsx)
* **وظيفته**: شريط أفقي قابل للسحب يحتوي على كافة أقسام المنيو (الكل، قهوة ساخنة، مشروبات ساقعة، موهيتو، حلويات...). عند الضغط على أي قسم، يقوم بعمل سكرول سلس (Smooth Scroll) حتى بداية ذلك القسم في الصفحة مع تشغيل صوت تقليب الورق.

---

### 4. كرت الصنف الفردي (Menu Card)
* **الملف المسئول**: [`src/components/features/MenuCard.tsx`](file:///Users/jrslam/D95/src/components/features/MenuCard.tsx)
* **العناصر الموجودة في الكرت**:
  - صورة الصنف بدقة عالية وتأثير الزووم عند التمرير.
  - الشارات الخاصة (Badge): مثل `Popular` (بالأحمر)، `New` (بالأخضر)، `Chef's Choice` (بالذهبي).
  - اسم الصنف، وصف المكونات، السعر بالجنيه المصري.
  - زر **"أضف +"**: يفتح نافذة التخصيص أو يضيف الصنف للسلة.

---

### 5. نافذة تخصيص الصنف (Item Customizer Modal)
* **الملف المسئول**: [`src/components/features/ItemCustomizerModal.tsx`](file:///Users/jrslam/D95/src/components/features/ItemCustomizerModal.tsx)
* **العناصر المتاحة للتعديل**:
  - عداد الكمية (`+` و `-`).
  - حقل إضافة ملاحظات أو طلبات خاصة للباريستا.
  - زر الإضافة النهائي: `إضافة للسلة • [الإجمالي] ج.م` مع تشغيل صوت النغمة الرنانة (`playCartChime`).

---

### 6. قسم العروض الخاصة (Offers Section)
* **الملف المسئول**: [`src/components/features/OffersSection.tsx`](file:///Users/jrslam/D95/src/components/features/OffersSection.tsx)
* **المحتوى**:
  - كروت وبانرات العروض الحصرية مع السعر قبل وبعد الخصم ونسبة التوفير.
  - مدمج معه جلب العروض النشطة من قاعدة البيانات (`liveOffers`).

---

### 7. شعار D95 بالفرشاة (D95 Brush Logo)
* **الملف المسئول**: [`src/components/brand/D95BrushLogo.tsx`](file:///Users/jrslam/D95/src/components/brand/D95BrushLogo.tsx)
* **وظيفته**: رسم شعار D95 الاحترافي بتأثير ضربات الفرشاة (Brush Effect)، ويتضمن خيارات التحكم بالحجم (`sm`, `md`, `lg`, `xl`) وإظهار النص الفرعي والتوهج النيوني الأحمر.

---

## 🛠️ مكونات لوحة تحكم الإدارة (Admin Dashboard Components)

| المكون | الملف | الوظيفة التفصيلية |
| :--- | :--- | :--- |
| **تبويب الحجوزات والتشغيل** | [`SimpleOperationsTab.tsx`](file:///Users/jrslam/D95/src/components/admin/SimpleOperationsTab.tsx) | عرض حجوزات الغرف اليومية، مواعيد كل غرفة، التايم لاين، فرز الحجوزات حسب الحالة، تأكيد أو إلغاء الحجز، وحل التعارضات. |
| **نافذة تفاصيل الحجز** | [`BookingDetailsModal.tsx`](file:///Users/jrslam/D95/src/components/admin/BookingDetailsModal.tsx) | نافذة منبثقة للآدمن لمشاهدة تفاصيل الحجز كاملة، الاتصال بالعميل هاتفياً أو واتساب، وتعديل الموعد أو السعر. |
| **تبويب طلبات الكافيه** | [`OrdersTab.tsx`](file:///Users/jrslam/D95/src/components/admin/OrdersTab.tsx) | استقبال طلبات الكافيه الفورية، تغيير الحالة (قيد الانتظار ⬅️ جاري التجهيز ⬅️ مكتمل / ملغي)، وطباعة الفاتورة. |
| **إدارة أصناف المنيو** | [`SimpleMenuSettingsTab.tsx`](file:///Users/jrslam/D95/src/components/admin/SimpleMenuSettingsTab.tsx) | إضافة صنف جديد، تعديل الأسعار، إخفاء صنف غير متوفر، وحذف الأصناف والعروض. |
| **نافذة الصنف** | [`ProductModal.tsx`](file:///Users/jrslam/D95/src/components/admin/ProductModal.tsx) | فورم إدخال بيانات الصنف (الاسم، الوصف، السعر، الصورة، القسم، الشارة). |
| **نافذة القسم** | [`CategoryModal.tsx`](file:///Users/jrslam/D95/src/components/admin/CategoryModal.tsx) | إضافة أو تعديل تصنيفات المنيو وأيقوناتها. |
| **نافذة العرض** | [`OfferModal.tsx`](file:///Users/jrslam/D95/src/components/admin/OfferModal.tsx) | إضافة وتعديل العروض الترويجية والخصومات. |
| **إعدادات الدفع والمحافظ** | [`PaymentSettingsTab.tsx`](file:///Users/jrslam/D95/src/components/admin/PaymentSettingsTab.tsx) | تعديل رقم محفظة فودافون كاش، معرف إنستاباي، ورابط الدفع، مع حفظها فوراً في قاعدة البيانات. |

---

## 💾 إدارة الحالة العامة (Global Stores & State)

### 1. سلة المشتريات والطلبات ([`src/stores/cartStore.tsx`](file:///Users/jrslam/D95/src/stores/cartStore.tsx))
* يحتوي على:
  - `items`: قائمة أصناف الكافيه داخل السلة.
  - `booking`: بيانات حجز الغرفة الحالية إن وجدت.
  - `addItem`, `removeItem`, `updateQty`, `clearCart`: دوال التحكم بالسلة.
  - `isOpen`, `openCart`, `closeCart`: فتح وإغلاق السلة المنبثقة برمجياً من أي مكان.
  - `cafeTotal`, `bookingTotal`, `itemCount`: الحسابات التلقائية للإجماليات.
  - تخزين تلقائي محلي في المتصفح `localStorage` لضمان عدم ضياع السلة عند إعادة تحميل الصفحة.

### 2. الثيم والمظهر ([`src/stores/themeStore.tsx`](file:///Users/jrslam/D95/src/stores/themeStore.tsx))
* يحتوي على:
  - `theme`: إما `'dark'` (ليلي) أو `'light'` (نهاري).
  - `toggleTheme`: التبديل بينهما وتطبيق فئة `dark` على وسم `<html>` وحفظ الاختيار في `localStorage`.

---

## 📞 البيانات الثابتة ونصوص النظام (Constants)

إذا أردت تعديل رقم هاتف، واتساب، أو عنوان يظهر في أي مكان بالموقع دون لمس أكواد الـ UI، فمكانك هو:

### [`src/constants/contactInfo.ts`](file:///Users/jrslam/D95/src/constants/contactInfo.ts)
```typescript
export const CONTACT_INFO = {
    brandName: 'D95',
    fullName: 'D95 Gaming Lounge & Specialty Café',
    phoneDisplay: '01000000095',        // الرقم الظاهر للعملاء
    phoneInternational: '201000000095', // رقم الاتصال الدولي
    whatsappNumber: '201000000095',     // رقم الواتساب الرسمي
    instapayHandle: 'd95lounge@instapay', // معرف إنستاباي
    walletNumber: '01000000095',        // رقم فودافون كاش / المحفظة
    workingHours: 'يومياً: 08:00 ص – 04:00 ص (20 ساعة متواصلة)',
    address: 'D95 Gaming Lounge & Café',
    googleMapsLink: 'https://maps.google.com',
    mapsEmbedSrc: '',
    instagramHandle: '@daboor_1995',
    instagramUrl: 'https://www.instagram.com/daboor_1995/',
};
```

---

## 🎨 التنسيقات والألوان والخطوط (Styling & Theming)

1. **المتغيرات اللونية والفلاتر**:
   - الملف: [`src/index.css`](file:///Users/jrslam/D95/src/index.css)
   - يحتوي على المتغيرات اللونية:
     - `--bg-main`: لون الخلفية الأساسية (للنهاري والليلي).
     - `--brand-red`: اللون الأحمر المميز لـ D95 (`#dc2626` أو `#E5252A`).
     - نسيج الجدار الخرساني الصناعي: فئة `.bg-concrete-wall`.
     - تأثير الكروت الخرسانية مع حواف النيون: فئة `.concrete-card` و `.grunge-frame`.
2. **إعدادات Tailwind والخطوط**:
   - الملف: [`tailwind.config.ts`](file:///Users/jrslam/D95/tailwind.config.ts)
   - الخطوط المعتمدة:
     - `font-bebas`: خط Bebas Neue للعناوين الضخمة والأرقام الرياضية.
     - `font-body` / `font-cairo`: خط Cairo للعربية بوضوح عالي.
     - `font-brush`: خط Brush للعناصر الفنية وشعار D95.

---

## 💡 طريقة طلب التعديل بدقة

عندما ترغب في تعديل زر أو ميزة أو نص مستقبلاً، يمكنك إخباري بالصيغ المباشرة الآتية لنصل للملف والسطر المطلوب في ثوانٍ معدودة:

* **مثال 1**: *"عايز أعدل زرار 'احجز الآن' في كرت غرفة 01 بصفحة البلايستيشن"*  
  ⬅️ سيتم التعديل مباشرة في [`src/pages/PlaystationPage.tsx`](file:///Users/jrslam/D95/src/pages/PlaystationPage.tsx).
* **مثال 2**: *"عايز أغير ألوان أو وقت عجلة تحديد الساعة في الحجز"*  
  ⬅️ سيتم التعديل في [`src/pages/BookingDetailsPage.tsx`](file:///Users/jrslam/D95/src/pages/BookingDetailsPage.tsx).
* **مثال 3**: *"عايز أعدل رسالة الواتساب الجاهزة اللي بتتبعت بعد تأكيد الحجز"*  
  ⬅️ سيتم التعديل في [`src/pages/BookingSuccessPage.tsx`](file:///Users/jrslam/D95/src/pages/BookingSuccessPage.tsx).
* **مثال 4**: *"عايز أضيف خيار جديد في نافذة تخصيص المشروب"*  
  ⬅️ سيتم التعديل في [`src/components/features/ItemCustomizerModal.tsx`](file:///Users/jrslam/D95/src/components/features/ItemCustomizerModal.tsx).
* **مثال 5**: *"عايز أعدل شريط النافبار السفلي في الموبايل"*  
  ⬅️ سيتم التعديل في [`src/components/layout/BottomNav.tsx`](file:///Users/jrslam/D95/src/components/layout/BottomNav.tsx).
