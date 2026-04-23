const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'ТКС_Ответы_на_зачёт.md');
const OUT = path.join(__dirname, 'index.html');

const raw = fs.readFileSync(SRC, 'utf-8').replace(/\r\n/g, '\n');

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(s) {
  s = escapeHtml(s);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return s;
}

function renderBody(md) {
  const lines = md.split('\n');
  const blocks = [];
  let buf = [];
  let inQuote = false;

  const flushPara = () => {
    if (buf.length) {
      const text = buf.join(' ').trim();
      if (text) blocks.push(`<p>${inline(text)}</p>`);
      buf = [];
    }
  };

  for (const line of lines) {
    if (/^\s*$/.test(line)) {
      flushPara();
      inQuote = false;
      continue;
    }
    if (line.startsWith('> ')) {
      flushPara();
      const text = line.slice(2).trim();
      if (inQuote) {
        const prev = blocks.pop();
        blocks.push(prev.replace(/<\/blockquote>$/, ` ${inline(text)}</blockquote>`));
      } else {
        blocks.push(`<blockquote>${inline(text)}</blockquote>`);
        inQuote = true;
      }
      continue;
    }
    inQuote = false;
    buf.push(line.trim());
  }
  flushPara();
  return blocks.join('\n');
}

// Split into sections using '---' on its own line
const sections = raw.split(/\n---\n/).map(s => s.trim()).filter(Boolean);

const items = [];
let preamble = '';

for (const section of sections) {
  const m = section.match(/^##\s+(.+?)\n([\s\S]*)$/);
  if (m) {
    const title = m[1].trim();
    const body = m[2].trim();
    // Skip non-question headers (e.g. just "Ответы на вопросы ...")
    if (/Вопрос\s+\d+/i.test(title)) {
      const numMatch = title.match(/Вопрос\s+(\d+)/i);
      const num = numMatch ? parseInt(numMatch[1], 10) : null;
      // Strip leading emoji indicator for display, but keep info
      const cleanTitle = title.replace(/^[📘⚠️\s]+/, '').trim();
      items.push({ num, title: cleanTitle, rawTitle: title, body: renderBody(body) });
    }
  } else if (!preamble) {
    // First section (title block)
    preamble = section;
  }
}

items.sort((a, b) => (a.num ?? 0) - (b.num ?? 0));

const detailsHtml = items.map(it => {
  const badge = /^⚠️/.test(it.rawTitle) ? '<span class="badge badge-warn" title="Вне пособия">⚠</span>' : '<span class="badge badge-ok" title="По пособию">📘</span>';
  return `<details class="q">
<summary><span class="num">${it.num}</span>${badge}<span class="title">${escapeHtml(it.title)}</span></summary>
<div class="a">
${it.body}
</div>
</details>`;
}).join('\n\n');

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>telekeki — ТКС: ответы на зачёт</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="site-header">
  <h1>telekeki</h1>
  <p class="subtitle">Ответы на вопросы к зачёту по дисциплине «Телекоммуникационные системы»</p>
  <div class="toolbar">
    <input id="search" type="search" placeholder="Поиск по вопросам…" autocomplete="off">
    <button id="expand-all" type="button">Раскрыть все</button>
    <button id="collapse-all" type="button">Свернуть все</button>
  </div>
  <p class="legend"><span class="badge badge-ok">📘</span> — по пособию, <span class="badge badge-warn">⚠</span> — вне пособия</p>
</header>

<main id="questions">
${detailsHtml}
</main>

<footer class="site-footer">
  <p>Всего вопросов: ${items.length}. Источник: учебное пособие А.А. Савочкина, СевГУ, 2015.</p>
</footer>

<script src="script.js"></script>
</body>
</html>
`;

fs.writeFileSync(OUT, html, 'utf-8');
console.log(`Generated ${OUT}: ${items.length} questions`);
