# تشغيل المشروع محليًا (Vite + React + Tailwind)

> هذا المشروع يحتوي على المكوّن **ThreeStepInvoiceWizard** كما أرسلته، مع دعم Tailwind و أيقونات `lucide-react`،
> وصور ثابتة `logo.png` و `qr.png` داخل مجلد `public/`.

## المتطلبات
- **Node.js 18+** (أو 20+) و **npm** مفعّل.
  - على ويندوز: حمّل Node من https://nodejs.org (اختر الإصدار LTS).

## خطوات التشغيل
1. فك ضغط الملف.
2. من داخل المجلد `road-biker-invoice-wizard/` نفّذ:
   ```bash
   npm install
   npm run dev
   ```
3. افتح المتصفح على الرابط الذي يظهر لك (عادة: <http://localhost:5173>).

## بناء نسخة إنتاج
```bash
npm run build
npm run preview
```

## تعديل الصور
- استبدل `public/logo.png` و `public/qr.png` بالنسخ الحقيقية لديك **مع نفس الأسماء**.

## ملاحظات
- اتجاه الصفحة **RTL** والمطبوعات مهيأة عبر CSS داخل المكون.
- في حال رغبت بنقل المكوّن لمشروعك الحالي: انسخ `App.jsx` واستورد أيقونات `lucide-react` وثبّت Tailwind بنفس الإعدادات.
