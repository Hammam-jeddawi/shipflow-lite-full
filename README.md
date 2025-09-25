# ShipFlow Lite (Full)

## التشغيل
1. فك الضغط في مسار بسيط: `C:\shipflow-lite-full`
2. افتح PowerShell داخل المجلد:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
   npm install
   npm run dev
   ```
3. افتح:
   - عميل: http://localhost:5173/login/customer
   - مندوب: افتح نافذة PowerShell ثانية ثم:
     ```powershell
     npm run dev:5174
     ```
     ثم http://localhost:5174/login/courier

## ملاحظات
- OTP يظهر في Console (وهمي): راقب المتصفح بعد طلب الرمز.
- الشحنة تبقى Draft حتى يضغط العميل "إنهاء التسوق" ويحدد موقع الاستلام.
- زر "تم التسليم" لا يظهر للمندوب إلا بعد تحديد الموقع.
- حالة العناصر عند المندوب: جاهز للتجميع ↔ تم التجميع (مع تأكيد).
