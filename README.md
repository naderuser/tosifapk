# 📝 پنل معلم - ساخت آزمون

یک پنل طراحی آزمون آنلاین برای معلمان ایرانی

## 🚀 دیپلوی روی Cloudflare Pages

### روش 1: از طریق Dashboard

1. وارد [Cloudflare Dashboard](https://dash.cloudflare.com) شوید
2. به **Workers & Pages** بروید
3. روی **Create application** کلیک کنید
4. **Pages** > **Upload directly**
5. پوشه `exam-panel` را آپلود کنید
6. دامنه دلخواه را تنظیم کنید

### روش 2: از طریق CLI

```bash
# نصب Wrangler CLI
npm install -g wrangler

# ورود به حساب Cloudflare
wrangler login

# دیپلوی
cd exam-panel
wrangler pages deploy .
```

### روش 3: از طریق GitHub

1. این پروژه را به GitHub push کنید
2. در Cloudflare Pages یک پروژه جدید بسازید
3. **Connect to Git** را انتخاب کنید
4. ریپو را وصل کنید

## ✨ امکانات

- طراحی سوالات چهارگزینه‌ای
- سوالات صحیح/غلط
- سوالات کوتاه‌پاسخ
- علائم ریاضی
- خروجی PDF و Word
- پیش‌نمایش زنده
- پشتیبانی از فارسی (RTL)

## 📁 ساختار پروژه

```
exam-panel/
├── index.html      # فایل اصلی برنامه
├── wrangler.toml   # تنظیمات Cloudflare
└── README.md       # مستندات
```
