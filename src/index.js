/**
 * پنل معلم - Cloudflare Worker
 * سیستم طراحی و مدیریت آزمون آنلاین
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Serve static files
    if (path === '/' || path === '/index.html') {
      return new Response(HTML_CONTENT, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // API Routes
    try {
      let response;

      if (path === '/api/exams' && request.method === 'GET') {
        response = await getAllExams(env);
      } 
      else if (path === '/api/exams' && request.method === 'POST') {
        response = await createExam(request, env);
      }
      else if (path.startsWith('/api/exams/') && request.method === 'GET') {
        const id = path.split('/')[3];
        response = await getExam(id, env);
      }
      else if (path.startsWith('/api/exams/') && request.method === 'PUT') {
        const id = path.split('/')[3];
        response = await updateExam(id, request, env);
      }
      else if (path.startsWith('/api/exams/') && request.method === 'DELETE') {
        const id = path.split('/')[3];
        response = await deleteExam(id, env);
      }
      else if (path === '/api/export/word' && request.method === 'POST') {
        response = await exportWord(request, env);
      }
      else if (path === '/api/export/pdf' && request.method === 'POST') {
        response = await exportPdf(request, env);
      }
      else {
        response = new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Add CORS headers
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};

// ═══════════════════════════════════════════════════════════
// API Functions
// ═══════════════════════════════════════════════════════════

async function getAllExams(env) {
  const data = await env.EXAM_KV.get('exams', 'json');
  return new Response(JSON.stringify(data || []), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function createExam(request, env) {
  const body = await request.json();
  
  const exam = {
    id: generateId(),
    name: body.name || 'آزمون بدون نام',
    grade: body.grade || '',
    school: body.school || '',
    teacher: body.teacher || '',
    date: body.date || '',
    duration: body.duration || '',
    department: body.department || '',
    evaluation: body.evaluation || 'points',
    questions: body.questions || [],
    overallFeedback: body.overallFeedback || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Get existing exams
  const exams = await env.EXAM_KV.get('exams', 'json') || [];
  exams.push(exam);
  await env.EXAM_KV.put('exams', JSON.stringify(exams));

  return new Response(JSON.stringify(exam), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getExam(id, env) {
  const exams = await env.EXAM_KV.get('exams', 'json') || [];
  const exam = exams.find(e => e.id === id);
  
  if (!exam) {
    return new Response(JSON.stringify({ error: 'آزمون یافت نشد' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(exam), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function updateExam(id, request, env) {
  const body = await request.json();
  const exams = await env.EXAM_KV.get('exams', 'json') || [];
  const index = exams.findIndex(e => e.id === id);

  if (index === -1) {
    return new Response(JSON.stringify({ error: 'آزمون یافت نشد' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  exams[index] = {
    ...exams[index],
    ...body,
    id, // Keep original ID
    updatedAt: new Date().toISOString(),
  };

  await env.EXAM_KV.put('exams', JSON.stringify(exams));

  return new Response(JSON.stringify(exams[index]), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function deleteExam(id, env) {
  const exams = await env.EXAM_KV.get('exams', 'json') || [];
  const filtered = exams.filter(e => e.id !== id);

  if (filtered.length === exams.length) {
    return new Response(JSON.stringify({ error: 'آزمون یافت نشد' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await env.EXAM_KV.put('exams', JSON.stringify(filtered));

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function exportWord(request, env) {
  const body = await request.json();
  const html = generateWordHTML(body);
  
  return new Response(html, {
    headers: {
      'Content-Type': 'application/msword',
      'Content-Disposition': `attachment; filename="${body.name || 'exam'}.doc"`,
    },
  });
}

async function exportPdf(request, env) {
  const body = await request.json();
  const html = generatePdfHTML(body);
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

// ═══════════════════════════════════════════════════════════
// HTML Generators
// ═══════════════════════════════════════════════════════════

function generateWordHTML(exam) {
  const { name, grade, school, teacher, date, duration, department, evaluation, questions, overallFeedback } = exam;
  const isFeedback = evaluation === 'feedback';
  const totalPoints = questions.reduce((sum, q) => sum + (parseFloat(q.points) || 0), 0);
  
  const digits = ['۱','۲','۳','۴','۵','۶','۷','۸','۹','۱۰'];

  let rows = questions.map((q, i) => {
    let body = q.text || '';
    
    if (q.type === 'multiple-choice' && q.options) {
      body += '<br>' + q.options.map((o, oi) => `${digits[oi]}) ${o || '..........'}`).join('&nbsp;&nbsp;&nbsp;');
    }
    if (q.type === 'true-false') {
      body += '<br>صحیح ☐&nbsp;&nbsp;&nbsp;غلط ☐';
    }
    if (q.type === 'short-answer') {
      body += '<br>....................';
    }
    if (q.shape) {
      body += `<br>شکل: ${q.shape}`;
    }
    
    const val = isFeedback ? (q.feedback || '') : (q.points || '');
    
    return `<tr>
      <td style="border:1.5px solid #000;padding:8px;text-align:center;width:48px">${digits[i] || i+1}</td>
      <td style="border:1.5px solid #000;padding:8px">${body}</td>
      <td style="border:1.5px solid #000;padding:8px;text-align:center;width:60px">${val}</td>
    </tr>`;
  }).join('');

  const totalRow = !isFeedback && questions.length ? `
    <tr>
      <td style="border:1.5px solid #000;padding:8px;background:#f5f5f5"></td>
      <td style="border:1.5px solid #000;padding:8px;background:#f5f5f5"><b>جمع کل</b></td>
      <td style="border:1.5px solid #000;padding:8px;text-align:center;background:#f5f5f5"><b>${totalPoints}</b></td>
    </tr>` : '';

  const feedbackRow = isFeedback && overallFeedback ? `
    <table style="width:100%;border-collapse:collapse;margin-top:16px">
      <tr>
        <td style="border:1.5px solid #000;padding:8px;width:100px;background:#fafafa"><b>بازخورد کلی</b></td>
        <td style="border:1.5px solid #000;padding:8px">${overallFeedback}</td>
      </tr>
    </table>` : '';

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40" dir="rtl" lang="fa">
<head>
  <meta charset="utf-8"/>
  <title>${name}</title>
  <style>
    @page { size:A4; margin:2cm }
    body { font-family:'B Nazanin',Tahoma,sans-serif; direction:rtl }
    table { direction:rtl }
    td,th { font-family:'B Nazanin',Tahoma,sans-serif }
  </style>
</head>
<body dir="rtl">
  <div style="text-align:center;font-size:15px;margin-bottom:14px">بسم الله الرحمن الرحیم</div>
  
  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td style="border:1.5px solid #000;padding:8px;width:34%">اداره آموزش و پرورش: ${department || '..........'}</td>
      <td style="border:1.5px solid #000;padding:8px;text-align:center;width:33%"><b>${name || '..........'}</b></td>
      <td style="border:1.5px solid #000;padding:8px;width:33%">پایه: <b>${grade || '..........'}</b></td>
    </tr>
    <tr>
      <td style="border:1.5px solid #000;padding:8px">نام و نام خانوادگی:</td>
      <td style="border:1.5px solid #000;padding:8px">نام پدر:</td>
      <td style="border:1.5px solid #000;padding:8px">نام مدرسه: ${school || '..........'}</td>
    </tr>
    <tr>
      <td style="border:1.5px solid #000;padding:8px">نام آموزگار: ${teacher || '..........'}</td>
      <td style="border:1.5px solid #000;padding:8px">تاریخ آزمون: ${date || '..........'}</td>
      <td style="border:1.5px solid #000;padding:8px">مدت زمان: <b>${duration || '..........'}</b></td>
    </tr>
  </table>

  <table style="width:100%;border-collapse:collapse;margin-top:16px">
    <tr>
      <th style="border:1.5px solid #000;padding:8px;background:#f2f2f2;text-align:center;width:48px">ردیف</th>
      <th style="border:1.5px solid #000;padding:8px;background:#f2f2f2">سوال</th>
      <th style="border:1.5px solid #000;padding:8px;background:#f2f2f2;text-align:center;width:60px">${isFeedback ? 'بازخورد' : 'بارم'}</th>
    </tr>
    ${rows}
    ${totalRow}
  </table>

  ${feedbackRow}

  <div style="text-align:center;margin-top:26px;font-weight:bold">موفق و پیروز باشید 🌸</div>
</body>
</html>`;
}

function generatePdfHTML(exam) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="utf-8"/>
  <title>${exam.name || 'آزمون'}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body>
  <div id="content">
    ${generateWordHTML(exam).replace(/<!DOCTYPE html>.*<body dir="rtl">/s, '').replace(/<\/body><\/html>$/, '')}
  </div>
  <script>
    window.onload = async function() {
      const element = document.getElementById('content');
      const opt = {
        margin: 10,
        filename: '${exam.name || 'exam'}.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#fff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
    };
  </script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════

function generateId() {
  return 'exam_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ═══════════════════════════════════════════════════════════
// HTML Content (Frontend)
// ═══════════════════════════════════════════════════════════

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>پنل معلم — ساخت آزمون</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'B Nazanin','Vazirmatn',Tahoma,sans-serif;direction:rtl;background:#f5f6fa;color:#2d2d44;min-height:100vh}
:root{--primary:#6c5ce7;--primary-dark:#5a4bd4;--primary-light:#eeebfd;--bg:#f5f6fa;--card:#fff;--border:#e6e8f0;--muted:#8a8fa3;--blue:#2f6fed;--orange:#ff6b4a;--green:#22b07d;--radius:14px;--shadow:0 4px 20px rgba(45,45,68,.06)}
.shell{display:flex;min-height:100vh}
.sidebar{width:260px;flex-shrink:0;background:var(--card);border-left:1px solid var(--border);padding:24px 18px;display:flex;flex-direction:column;gap:28px}
.brand{display:flex;align-items:center;gap:12px;flex-direction:row-reverse}
.brand-icon{width:46px;height:46px;border-radius:12px;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:22px}
.brand-title{font-weight:700;font-size:17px}
.brand-sub{font-size:12px;color:var(--muted)}
.nav{display:flex;flex-direction:column;gap:8px}
.nav-btn{display:flex;align-items:center;gap:10px;padding:12px 16px;border:none;border-radius:12px;background:transparent;color:#2d2d44;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;width:100%;transition:background .15s;text-align:right}
.nav-btn:hover{background:var(--bg)}
.nav-btn.active{background:var(--primary);color:#fff}
.exam-list{display:flex;flex-direction:column;gap:6px;max-height:300px;overflow-y:auto}
.exam-item{padding:10px 12px;border-radius:8px;background:var(--bg);font-size:13px;cursor:pointer;transition:background .15s;display:flex;justify-content:space-between;align-items:center}
.exam-item:hover{background:var(--primary-light)}
.exam-item.active{background:var(--primary);color:#fff}
.tip{margin-top:auto;background:var(--primary-light);color:var(--primary-dark);padding:14px;border-radius:12px;font-size:13px;line-height:1.7}
.main{flex:1;display:flex;flex-direction:column;min-width:0}
.topbar{display:flex;align-items:center;gap:14px;flex-direction:row-reverse;padding:16px 32px;background:var(--card);border-bottom:1px solid var(--border)}
.avatar{width:42px;height:42px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:22px}
.welcome{font-size:15px;font-weight:600}
.page{flex:1;padding:26px 32px;overflow-y:auto}
.page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:24px;flex-wrap:wrap}
.title-block{text-align:right}
.page-title{font-size:26px;font-weight:800;display:flex;align-items:center;gap:10px;flex-direction:row-reverse}
.subtitle{color:var(--muted);font-size:14px;margin-top:6px}
.downloads{display:flex;gap:10px}
.btn{position:relative;border:none;border-radius:10px;padding:11px 18px;font-family:inherit;font-size:14px;font-weight:700;color:#fff;cursor:pointer;transition:opacity .15s}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-pdf{background:var(--orange)}.btn-word{background:var(--blue)}
.btn-primary{background:var(--primary)}
.btn:hover:not(:disabled){opacity:.92}
.btn-success{background:var(--green)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);padding:20px}
.card-title{font-size:17px;font-weight:700;margin-bottom:16px;text-align:right;display:flex;align-items:center;gap:8px}
.fields{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.field{display:flex;flex-direction:column;gap:6px;text-align:right}
.field label{font-size:13px;color:var(--muted)}
.field input,.field select,.field textarea{border:1px solid var(--border);border-radius:10px;padding:11px 12px;font-family:inherit;font-size:14px;background:var(--bg);outline:none;text-align:right;color:#2d2d44;width:100%}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--primary);background:#fff}
.field.full{grid-column:1/-1}
.eval-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.eval-btn{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:18px;border:1px solid var(--border);border-radius:12px;background:var(--card);font-family:inherit;font-size:15px;font-weight:600;cursor:pointer;transition:all .15s;width:100%}
.eval-btn:hover{border-color:var(--primary);box-shadow:0 2px 10px rgba(108,92,231,.12)}
.eval-btn.active{border-color:var(--primary);background:var(--primary-light)}
.type-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:12px}
.type-btn{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px;border:1px solid var(--border);border-radius:12px;background:var(--card);font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s}
.type-btn:hover{border-color:var(--primary);box-shadow:0 2px 10px rgba(108,92,231,.12)}
.type-btn span:first-child{font-size:28px}
.math-label{margin:18px 0 10px;font-size:13px;color:var(--muted)}
.math-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:8px}
.math-btn{aspect-ratio:1;border:1px solid var(--border);border-radius:8px;background:var(--primary-light);color:var(--primary-dark);font-size:15px;font-weight:700;cursor:pointer;font-family:inherit}
.math-btn:hover{background:var(--primary);color:#fff}
.questions{display:flex;flex-direction:column;gap:16px;margin-top:4px}
.q-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden}
.q-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:10px}
.q-num{width:36px;height:36px;border-radius:10px;background:var(--primary-light);color:var(--primary-dark);display:flex;align-items:center;justify-content:center;font-weight:700;border:1px solid var(--primary)}
.q-type-label{font-weight:700;color:var(--primary)}
.q-actions{display:flex;gap:6px}
.icon-btn{width:32px;height:32px;border:1px solid var(--border);border-radius:8px;background:var(--bg);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center}
.icon-btn:hover{background:var(--primary-light)}
.q-body{display:flex;flex-direction:column}
.q-row{display:flex;border-bottom:1px solid var(--border)}
.row-label{width:70px;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:13px;border-left:1px solid var(--border)}
.q-textarea{flex:1;min-height:80px;border:none;padding:14px;font-family:inherit;font-size:14px;resize:vertical;outline:none;background:transparent;color:#2d2d44;direction:rtl}
.options-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px;border-bottom:1px solid var(--border)}
.option-row{display:flex;align-items:center;gap:8px}
.option-input{flex:1;border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-family:inherit;font-size:13px;outline:none;direction:rtl}
.option-input:focus{border-color:var(--primary)}
.q-footer{display:flex;align-items:center;padding:12px 14px;gap:10px;flex-wrap:wrap}
.footer-label{color:var(--muted);font-size:13px}
.points-input{width:80px;border:1px solid var(--border);border-radius:8px;padding:8px;font-family:inherit;font-size:14px;text-align:center;outline:none}
.points-input:focus{border-color:var(--primary)}
.feedback-input{flex:1;border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:inherit;font-size:13px;outline:none;direction:rtl}
.feedback-input:focus{border-color:var(--primary)}
.overall-feedback{width:100%;min-height:80px;border:1px solid var(--border);border-radius:10px;padding:12px;font-family:inherit;font-size:14px;resize:vertical;outline:none;direction:rtl}
.overall-feedback:focus{border-color:var(--primary)}
.preview-col{position:sticky;top:20px}
.preview-head{display:flex;align-items:center;justify-content:space-between;color:var(--muted);font-size:14px;margin-bottom:12px}
.count-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;background:var(--primary-light);color:var(--primary-dark);font-size:13px;font-weight:700}
.sheet{background:#fff;border:1px solid var(--border);border-radius:16px;padding:28px;box-shadow:0 2px 16px rgba(0,0,0,.04)}
.bismillah{text-align:center;font-size:17px;margin-bottom:18px;letter-spacing:1px}
.header-table{width:100%;border-collapse:collapse;margin-bottom:18px}
.header-table td{border:1.5px solid #000;padding:8px 10px;font-size:13px;vertical-align:middle}
.q-table{width:100%;border-collapse:collapse;margin-top:16px}
.q-table th,.q-table td{border:1.5px solid #000;padding:8px 10px;vertical-align:top;font-size:13px}
.q-table th{background:#f2f2f2;text-align:center;font-weight:700}
.col-row{width:48px;text-align:center}
.col-text{min-width:200px}
.col-points{width:60px;text-align:center}
.total-row{background:#f5f5f5}
.sheet-empty{text-align:center;padding:40px;color:var(--muted);font-size:15px}
.sheet-footer{text-align:center;margin-top:28px;font-weight:700}
.feedback-table{width:100%;border-collapse:collapse;margin-top:12px}
.feedback-table td{border:1.5px solid #000;padding:8px 10px;vertical-align:top}
.feedback-label-cell{width:100px;background:#fafafa;font-weight:700}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;opacity:0;transition:opacity .3s;z-index:1000}
.toast.show{opacity:1}
.empty-state{text-align:center;padding:60px 20px;color:var(--muted)}
.empty-state span{font-size:48px;display:block;margin-bottom:16px}
@media(max-width:900px){.grid{grid-template-columns:1fr}.shell{flex-direction:column}.sidebar{width:100%;border-left:none;border-bottom:1px solid var(--border)}.type-grid{grid-template-columns:1fr 1fr}.math-grid{grid-template-columns:repeat(5,1fr)}}
</style>
</head>
<body>

<aside class="sidebar">
  <div class="brand">
    <div class="brand-icon">📝</div>
    <div>
      <div class="brand-title">پنل معلم</div>
      <div class="brand-sub">طراحی آزمون آنلاین</div>
    </div>
  </div>
  <nav class="nav">
    <button class="nav-btn active" onclick="showNewExam()">➕ آزمون جدید</button>
    <button class="nav-btn" onclick="loadExams()">📋 لیست آزمون‌ها</button>
  </nav>
  <div class="exam-list" id="exam-list"></div>
  <div class="tip">💡 برای شروع، یک آزمون جدید بسازید یا از لیست انتخاب کنید.</div>
</aside>

<div class="main">
  <header class="topbar">
    <div class="avatar">👨‍🏫</div>
    <div>
      <div class="welcome">سلام، معلم عزیز!</div>
      <div style="font-size:12px;color:var(--muted)">امروز چه آزمونی طراحی می‌کنیم؟</div>
    </div>
  </header>

  <main class="page" id="main-page">
    <div class="page-header">
      <div class="title-block">
        <h1 class="page-title">🎓 طراحی آزمون</h1>
        <p class="subtitle" id="exam-subtitle">یک آزمون جدید بسازید</p>
      </div>
      <div class="downloads">
        <button class="btn btn-word" onclick="downloadWord()">📥 دریافت Word</button>
        <button class="btn btn-pdf" onclick="downloadPdf()">📥 دریافت PDF</button>
        <button class="btn btn-success" onclick="saveExam()">💾 ذخیره</button>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="card" style="margin-bottom:18px">
          <div class="card-title">📋 اطلاعات آزمون</div>
          <div class="fields">
            <div class="field"><label>نام آزمون</label><input id="m-name" placeholder="مثلاً: آزمون ریاضی پایان ترم" oninput="renderPreview()"/></div>
            <div class="field"><label>پایه تحصیلی</label><input id="m-grade" placeholder="مثلاً: هفتم" oninput="renderPreview()"/></div>
            <div class="field"><label>نام مدرسه</label><input id="m-school" placeholder="مثال: دبیرستان شهید چمران" oninput="renderPreview()"/></div>
            <div class="field"><label>نام آموزگار</label><input id="m-teacher" placeholder="مثال: زهرا احمدی" oninput="renderPreview()"/></div>
            <div class="field"><label>تاریخ آزمون</label><input id="m-date" placeholder="مثال: ۱۴۰۳/۰۳/۱۵" oninput="renderPreview()"/></div>
            <div class="field"><label>مدت زمان</label><input id="m-dur" placeholder="مثلاً: ۶۰ دقیقه" oninput="renderPreview()"/></div>
            <div class="field full"><label>اداره آموزش و پرورش</label><input id="m-dept" placeholder="مثلاً: اداره آموزش و پرورش ناحیه ۲" oninput="renderPreview()"/></div>
          </div>
        </div>

        <div class="card" style="margin-bottom:18px">
          <div class="card-title">📝 نوع ارزیابی</div>
          <div class="eval-grid">
            <button class="eval-btn active" id="eval-points" onclick="setEval('points')"><span>نمره‌دهی</span><span>🎯</span></button>
            <button class="eval-btn" id="eval-feedback" onclick="setEval('feedback')"><span>بازخورد</span><span>💬</span></button>
          </div>
        </div>

        <div class="card" style="margin-bottom:18px">
          <div class="card-title">➕ افزودن سوال</div>
          <div class="type-grid">
            <button class="type-btn" onclick="addQuestion('multiple-choice')"><span>☑️</span><span>چهارگزینه‌ای</span></button>
            <button class="type-btn" onclick="addQuestion('true-false')"><span>✓✗</span><span>صحیح/غلط</span></button>
            <button class="type-btn" onclick="addQuestion('short-answer')"><span>✍️</span><span>کوتاه‌پاسخ</span></button>
          </div>
          <div class="math-label">🧮 علائم ریاضی</div>
          <div class="math-grid">
            <button class="math-btn" onclick="insertMath('÷')">÷</button>
            <button class="math-btn" onclick="insertMath('×')">×</button>
            <button class="math-btn" onclick="insertMath('√')">√</button>
            <button class="math-btn" onclick="insertMath('²')">²</button>
            <button class="math-btn" onclick="insertMath('³')">³</button>
            <button class="math-btn" onclick="insertMath('π')">π</button>
            <button class="math-btn" onclick="insertMath('∞')">∞</button>
            <button class="math-btn" onclick="insertMath('≠')">≠</button>
            <button class="math-btn" onclick="insertMath('≤')">≤</button>
            <button class="math-btn" onclick="insertMath('≥')">≥</button>
          </div>
        </div>

        <div class="card" id="feedback-card" style="display:none">
          <div class="card-title">💬 بازخورد کلی</div>
          <textarea id="overall-feedback" class="overall-feedback" placeholder="بازخورد کلی خود را بنویسید..." oninput="renderPreview()"></textarea>
        </div>
      </div>

      <div>
        <div class="questions" id="questions-list"></div>
        <div class="preview-col" style="margin-top:24px">
          <div class="preview-head">
            <span>📄 پیش‌نمایش</span>
            <span id="count-badge" class="count-badge">۰ سوال</span>
          </div>
          <div id="preview-wrap"></div>
        </div>
      </div>
    </div>
  </main>
</div>

<div id="toast" class="toast"></div>

<script>
// State
let currentExamId = null;
let evaluation = 'points';
let questions = [];
const typeLabels = { 'multiple-choice': 'چهارگزینه‌ای', 'true-false': 'صحیح/غلط', 'short-answer': 'کوتاه‌پاسخ' };
const digits = ['۱','۲','۳','۴','۵','۶','۷','۸','۹','۱۰'];

// Init
loadExams();
renderQuestions();
renderPreview();

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function showNewExam() {
  currentExamId = null;
  questions = [];
  document.getElementById('m-name').value = '';
  document.getElementById('m-grade').value = '';
  document.getElementById('m-school').value = '';
  document.getElementById('m-teacher').value = '';
  document.getElementById('m-date').value = '';
  document.getElementById('m-dur').value = '';
  document.getElementById('m-dept').value = '';
  document.getElementById('overall-feedback').value = '';
  document.getElementById('exam-subtitle').textContent = 'یک آزمون جدید بسازید';
  setEval('points');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.nav-btn').classList.add('active');
  renderQuestions();
  renderPreview();
}

async function loadExams() {
  try {
    const res = await fetch('/api/exams');
    const exams = await res.json();
    const list = document.getElementById('exam-list');
    if (!exams.length) {
      list.innerHTML = '<div style="padding:10px;color:var(--muted);font-size:13px;text-align:center">هنوز آزمونی نیست</div>';
      return;
    }
    list.innerHTML = exams.map(e => \`
      <div class="exam-item \${e.id === currentExamId ? 'active' : ''}" onclick="loadExam('\${e.id}')">
        <span>\${e.name || 'بدون نام'}</span>
        <button class="icon-btn" onclick="event.stopPropagation();deleteExam('\${e.id}')" style="width:24px;height:24px;font-size:12px">🗑️</button>
      </div>
    \`).join('');
  } catch (err) {
    console.error('Error loading exams:', err);
  }
}

async function loadExam(id) {
  try {
    const res = await fetch(\`/api/exams/\${id}\`);
    const exam = await res.json();
    currentExamId = exam.id;
    questions = exam.questions || [];
    evaluation = exam.evaluation || 'points';
    document.getElementById('m-name').value = exam.name || '';
    document.getElementById('m-grade').value = exam.grade || '';
    document.getElementById('m-school').value = exam.school || '';
    document.getElementById('m-teacher').value = exam.teacher || '';
    document.getElementById('m-date').value = exam.date || '';
    document.getElementById('m-dur').value = exam.duration || '';
    document.getElementById('m-dept').value = exam.department || '';
    document.getElementById('overall-feedback').value = exam.overallFeedback || '';
    document.getElementById('exam-subtitle').textContent = exam.name || 'آزمون';
    setEval(evaluation);
    renderQuestions();
    renderPreview();
    loadExams();
  } catch (err) {
    showToast('خطا در بارگذاری آزمون');
  }
}

async function deleteExam(id) {
  if (!confirm('آیا از حذف این آزمون مطمئن هستید؟')) return;
  try {
    await fetch(\`/api/exams/\${id}\`, { method: 'DELETE' });
    showToast('آزمون حذف شد');
    if (currentExamId === id) showNewExam();
    loadExams();
  } catch (err) {
    showToast('خطا در حذف آزمون');
  }
}

async function saveExam() {
  const data = getExamData();
  try {
    let res;
    if (currentExamId) {
      res = await fetch(\`/api/exams/\${currentExamId}\`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } else {
      res = await fetch('/api/exams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    }
    const result = await res.json();
    if (!currentExamId) {
      currentExamId = result.id;
      document.getElementById('exam-subtitle').textContent = data.name || 'آزمون';
    }
    showToast('آزمون ذخیره شد ✅');
    loadExams();
  } catch (err) {
    showToast('خطا در ذخیره آزمون');
  }
}

function getExamData() {
  return {
    name: document.getElementById('m-name').value,
    grade: document.getElementById('m-grade').value,
    school: document.getElementById('m-school').value,
    teacher: document.getElementById('m-teacher').value,
    date: document.getElementById('m-date').value,
    duration: document.getElementById('m-dur').value,
    department: document.getElementById('m-dept').value,
    evaluation,
    questions,
    overallFeedback: document.getElementById('overall-feedback').value
  };
}

function setEval(mode) {
  evaluation = mode;
  document.getElementById('eval-points').classList.toggle('active', mode === 'points');
  document.getElementById('eval-feedback').classList.toggle('active', mode === 'feedback');
  document.getElementById('feedback-card').style.display = mode === 'feedback' ? 'flex' : 'none';
  renderQuestions();
  renderPreview();
}

function insertMath(sym) {
  const ta = document.activeElement;
  if (ta && ta.classList.contains('q-textarea')) {
    const s = ta.selectionStart;
    const v = ta.value;
    ta.value = v.slice(0, s) + sym + v.slice(s);
    ta.selectionStart = ta.selectionEnd = s + sym.length;
    ta.focus();
    ta.dispatchEvent(new Event('input'));
  }
}

function addQuestion(type) {
  questions.push({
    id: Date.now(),
    type,
    text: '',
    points: type === 'short-answer' ? '' : '۱',
    feedback: '',
    shape: '',
    options: type === 'multiple-choice' ? ['', '', '', ''] : null
  });
  renderQuestions();
  renderPreview();
  document.getElementById('questions-list').lastElementChild?.scrollIntoView({ behavior: 'smooth' });
}

function removeQuestion(id) {
  questions = questions.filter(q => q.id !== id);
  renderQuestions();
  renderPreview();
}

function moveQuestion(id, dir) {
  const idx = questions.findIndex(q => q.id === id);
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= questions.length) return;
  [questions[idx], questions[newIdx]] = [questions[newIdx], questions[idx]];
  renderQuestions();
  renderPreview();
}

function updateQ(id, field, value) {
  const q = questions.find(q => q.id === id);
  if (!q) return;
  if (field === 'points' && evaluation === 'feedback') {
    q.feedback = value;
  } else {
    q[field] = value;
  }
  renderPreview();
}

function updateOption(qid, oi, val) {
  const q = questions.find(q => q.id === qid);
  if (q && q.options) q.options[oi] = val;
  renderPreview();
}

function renderQuestions() {
  const list = document.getElementById('questions-list');
  if (!questions.length) {
    list.innerHTML = '<div class="empty-state"><span>📝</span>هنوز سوالی اضافه نشده. از بالا یک نوع سوال انتخاب کنید.</div>';
    return;
  }
  list.innerHTML = questions.map((q, i) => \`
    <div class="q-card">
      <div class="q-header">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="q-num">\${digits[i] || i+1}</div>
          <span class="q-type-label">\${typeLabels[q.type]}</span>
        </div>
        <div class="q-actions">
          <button class="icon-btn" onclick="moveQuestion(\${q.id}, -1)" title="بالا">⬆️</button>
          <button class="icon-btn" onclick="moveQuestion(\${q.id}, 1)" title="پایین">⬇️</button>
          <button class="icon-btn" onclick="removeQuestion(\${q.id})" title="حذف">🗑️</button>
        </div>
      </div>
      <div class="q-body">
        <div class="q-row">
          <div class="row-label">صورت سوال</div>
          <textarea class="q-textarea" id="qtext-\${q.id}" placeholder="صورت سوال را بنویسید..." oninput="updateQ(\${q.id}, 'text', this.value)">\${q.text || ''}</textarea>
        </div>
        \${q.type === 'multiple-choice' ? \`
        <div class="options-grid">
          \${q.options.map((o, oi) => \`
          <div class="option-row">
            <span style="font-weight:700;color:var(--primary)">\${digits[oi]})</span>
            <input class="option-input" value="\${o || ''}" placeholder="گزینه \${['الف','ب','ج','د'][oi]}..." oninput="updateOption(\${q.id}, \${oi}, this.value)"/>
          </div>\`).join('')}
        </div>\` : ''}
        \${q.type === 'true-false' ? \`<div style="padding:14px;border-bottom:1px solid var(--border);color:var(--muted)">صحیح ☐&nbsp;&nbsp;&nbsp;غلط ☐</div>\` : ''}
        \${q.type === 'short-answer' ? \`<div style="padding:14px;border-bottom:1px solid var(--border);color:var(--muted)">پاسخ کوتاه: ............................</div>\` : ''}
        <div class="q-footer">
          <label class="footer-label">\${evaluation === 'feedback' ? 'بازخورد' : 'بارم'}:</label>
          \${evaluation === 'feedback'
            ? \`<input class="feedback-input" value="\${q.feedback || ''}" placeholder="بازخورد..." oninput="updateQ(\${q.id}, 'feedback', this.value)"/>\`
            : \`<input class="points-input" value="\${q.points || ''}" placeholder="۱" oninput="updateQ(\${q.id}, 'points', this.value)"/>\`}
          <label class="footer-label">شکل:</label>
          <select onchange="updateQ(\${q.id}, 'shape', this.value)" style="border:1px solid var(--border);border-radius:8px;padding:8px;font-family:inherit;font-size:13px;background:var(--bg)">
            <option value="">بدون شکل</option>
            <option value="مربع" \${q.shape === 'مربع' ? 'selected' : ''}>مربع</option>
            <option value="مستطیل" \${q.shape === 'مستطیل' ? 'selected' : ''}>مستطیل</option>
            <option value="مثلث" \${q.shape === 'مثلث' ? 'selected' : ''}>مثلث</option>
            <option value="دایره" \${q.shape === 'دایره' ? 'selected' : ''}>دایره</option>
            <option value="ذوزنقه" \${q.shape === 'ذوزنقه' ? 'selected' : ''}>ذوزنقه</option>
          </select>
        </div>
      </div>
    </div>\`).join('');
}

function renderPreview() {
  const m = {
    name: document.getElementById('m-name').value,
    grade: document.getElementById('m-grade').value,
    school: document.getElementById('m-school').value,
    dept: document.getElementById('m-dept').value,
    teacher: document.getElementById('m-teacher').value,
    date: document.getElementById('m-date').value,
    dur: document.getElementById('m-dur').value
  };
  const isFeedback = evaluation === 'feedback';
  const total = questions.reduce((s, q) => s + (parseFloat(q.points) || 0), 0);
  
  document.getElementById('count-badge').textContent = \`\${digits[questions.length - 1] || questions.length} سوال\`;

  let qRows = '';
  if (questions.length > 0) {
    questions.forEach((q, i) => {
      let body = q.text || \`(\${typeLabels[q.type]})\`;
      if (q.type === 'multiple-choice' && q.options) {
        body += '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:6px">' + q.options.map((o, oi) => \`<span>\${digits[oi]}) \${o || '..........'}</span>\`).join('') + '</div>';
      }
      if (q.type === 'true-false') body += '<div style="margin-top:6px">صحیح ⬜&nbsp;&nbsp;غلط ⬜</div>';
      if (q.type === 'short-answer') body += '<div style="margin-top:6px;color:#666">....................</div>';
      if (q.shape) body += \`<div style="margin-top:4px;font-size:12px">شکل: \${q.shape}</div>\`;
      const lastVal = isFeedback ? (q.feedback || '') : q.points;
      qRows += \`<tr><td class="col-row">\${digits[i] || i+1}</td><td class="col-text">\${body}</td><td class="col-points">\${lastVal}</td></tr>\`;
    });
  }

  const totalRow = !isFeedback && questions.length > 0 ? \`<tr class="total-row"><td class="col-row"></td><td class="col-text"><strong>جمع کل</strong></td><td class="col-points">\${total}</td></tr>\` : '';
  const feedbackRow = isFeedback ? \`<table class="feedback-table" style="margin-top:16px"><tr><td class="feedback-label-cell"><strong>بازخورد کلی</strong></td><td>\${document.getElementById('overall-feedback')?.value || ''}</td></tr></table>\` : '';

  document.getElementById('preview-wrap').innerHTML = \`
    <div class="sheet">
      <div class="bismillah">بسم الله الرحمن الرحیم</div>
      <table class="header-table">
        <tr>
          <td style="width:34%">اداره آموزش و پرورش: \${m.dept || '..........'}</td>
          <td style="width:33%;text-align:center"><strong>\${m.name || '..........'}</strong></td>
          <td style="width:33%">پایه: <strong>\${m.grade || '..........'}</strong></td>
        </tr>
        <tr>
          <td>نام و نام خانوادگی:</td>
          <td>نام پدر:</td>
          <td>نام مدرسه: \${m.school || '..........'}</td>
        </tr>
        <tr>
          <td>نام آموزگار: \${m.teacher || '..........'}</td>
          <td>تاریخ آزمون: \${m.date || '..........'}</td>
          <td>مدت زمان: <strong>\${m.dur || '..........'}</strong></td>
        </tr>
      </table>
      \${questions.length === 0
        ? '<div class="sheet-empty">هنوز سوالی اضافه نشده است</div>'
        : \`<table class="q-table"><thead><tr><th class="col-row">ردیف</th><th class="col-text">سوال</th><th class="col-points">\${isFeedback ? 'بازخورد' : 'بارم'}</th></tr></thead><tbody>\${qRows}\${totalRow}</tbody></table>\`}
      \${feedbackRow}
      <div class="sheet-footer">موفق و پیروز باشید 🌸</div>
    </div>\`;
}

async function downloadWord() {
  try {
    const data = getExamData();
    const res = await fetch('/api/export/word', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const blob = await res.blob();
    downloadBlob(blob, (data.name || 'آزمون') + '.doc');
    showToast('فایل Word دانلود شد ✅');
  } catch (err) {
    showToast('خطا در دانلود فایل Word');
  }
}

async function downloadPdf() {
  try {
    const el = document.getElementById('preview-wrap');
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(script);
    script.onload = async () => {
      const m = document.getElementById('m-name').value;
      const opt = { margin: 10, filename: (m || 'آزمون') + '.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, backgroundColor: '#fff' }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
      const blob = await html2pdf().set(opt).from(el).outputPdf('blob');
      downloadBlob(blob, (m || 'آزمون') + '.pdf');
      showToast('فایل PDF دانلود شد ✅');
    };
  } catch (err) {
    showToast('خطا در دانلود فایل PDF');
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
</script>
</body>
</html>`;
