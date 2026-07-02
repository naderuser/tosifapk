# 📝 پنل معلم - Cloudflare Worker

سیستم طراحی و مدیریت آزمون آنلاین روی Cloudflare Workers با KV Storage.

## ✨ امکانات

- ✅ طراحی سوالات چهارگزینه‌ای
- ✅ سوالات صحیح/غلط
- ✅ سوالات کوتاه‌پاسخ
- ✅ علائم ریاضی
- ✅ خروجی PDF و Word
- ✅ پیش‌نمایش زنده
- ✅ ذخیره آزمون‌ها در KV
- ✅ پشتیبانی از فارسی (RTL)

## 🚀 نصب و راه‌اندازی

### 1. نصب Wrangler CLI

```bash
npm install -g wrangler
```

### 2. کلون پروژه

```bash
git clone https://github.com/naderuser/tosifapk.git
cd tosifapk/exam-panel
```

### 3. تنظیم Cloudflare

1. وارد [Cloudflare Dashboard](https://dash.cloudflare.com) شوید
2. به **Workers & Pages** بروید
3. یک **KV Namespace** جدید بسازید
4. **ID** را کپی کنید

### 4. آپدیت wrangler.toml

```toml
[[kv_namespaces]]
binding = "EXAM_KV"
id = "YOUR_ACTUAL_KV_ID"  # ← اینجا قرار بدید
```

### 5. اجرای محلی

```bash
wrangler dev
```

### 6. دیپلوی

```bash
wrangler deploy
```

## 📁 ساختار پروژه

```
exam-panel/
├── src/
│   └── index.js      # Cloudflare Worker (API + Frontend)
├── wrangler.toml    # تنظیمات Cloudflare
├── package.json      # وابستگی‌ها
└── README.md        # مستندات
```

## 🌐 API Endpoints

| Method | Endpoint | توضیحات |
|--------|----------|---------|
| GET | `/api/exams` | لیست همه آزمون‌ها |
| POST | `/api/exams` | ساخت آزمون جدید |
| GET | `/api/exams/:id` | دریافت یک آزمون |
| PUT | `/api/exams/:id` | آپدیت آزمون |
| DELETE | `/api/exams/:id` | حذف آزمون |
| POST | `/api/export/word` | خروجی Word |
| POST | `/api/export/pdf` | خروجی PDF |

## 📋 ساختار داده آزمون

```json
{
  "id": "exam_xxx",
  "name": "آزمون ریاضی",
  "grade": "هفتم",
  "school": "دبیرستان شهید چمران",
  "teacher": "زهرا احمدی",
  "date": "۱۴۰۳/۰۳/۱۵",
  "duration": "۶۰ دقیقه",
  "department": "اداره آموزش و پرورش ناحیه ۲",
  "evaluation": "points",
  "questions": [...],
  "overallFeedback": ""
}
```

## ⚙️ تنظیمات متغیرها (Secrets)

```bash
# برای دیپلوی با KV
wrangler secret put KV_ID
# مقدار KV Namespace ID را وارد کنید
```

## 📜 لایسنس

MIT License
