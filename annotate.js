const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'ТКС_Ответы_на_зачёт.md');
let md = fs.readFileSync(SRC, 'utf-8');

const abbrs = [
  // Russian abbreviations
  ['ИКМ', 'импульсно-кодовая модуляция'],
  ['МСП', 'многоканальные системы передачи'],
  ['МСЭ', 'Международный союз электросвязи, ITU'],
  ['УКВ', 'ультракороткие волны'],
  ['ИСЗ', 'искусственный спутник Земли'],
  ['РРЛ', 'радиорелейная линия'],
  ['ПЭГ', 'первичный эталонный генератор'],
  ['ВЗГ', 'вторичный задающий генератор'],
  ['ВЭГ', 'вторичный эталонный генератор'],
  ['ВОК', 'волоконно-оптический кабель'],
  ['ПЦК', 'первичный цифровой канал'],
  ['ОЦК', 'основной цифровой канал'],

  // Standards bodies / organizations
  ['ITU-T', 'сектор стандартизации электросвязи ITU'],
  ['ETSI', 'European Telecommunications Standards Institute'],
  ['3GPP', '3rd Generation Partnership Project — консорциум по стандартам мобильной связи'],
  ['IEEE', 'Institute of Electrical and Electronics Engineers'],
  ['NIST', 'National Institute of Standards and Technology'],

  // OSI / network fundamentals
  ['OSI', 'Open Systems Interconnection'],
  ['MTU', 'Maximum Transmission Unit — максимальный размер передаваемого блока'],
  ['CRC', 'Cyclic Redundancy Check — циклический избыточный код'],
  ['MAC', 'Media Access Control — управление доступом к среде'],
  ['ARP', 'Address Resolution Protocol — протокол разрешения адресов'],
  ['ICMP', 'Internet Control Message Protocol'],
  ['TLS', 'Transport Layer Security'],
  ['SSL', 'Secure Sockets Layer'],
  ['RPC', 'Remote Procedure Call — удалённый вызов процедур'],
  ['HDLC', 'High-level Data Link Control'],
  ['PPP', 'Point-to-Point Protocol'],
  ['SNMP', 'Simple Network Management Protocol'],
  ['DHCP', 'Dynamic Host Configuration Protocol'],
  ['DNS', 'Domain Name System — служба доменных имён'],
  ['OSPF', 'Open Shortest Path First — протокол маршрутизации'],
  ['BGP', 'Border Gateway Protocol — межоператорский протокол маршрутизации'],

  // PDH/SDH/ATM (STM/VC/TU/AU/AUG/SOH/POH take -N suffix)
  ['PDH', 'Plesiochronous Digital Hierarchy'],
  ['SDH', 'Synchronous Digital Hierarchy'],
  ['SONET', 'Synchronous Optical Networking — американский аналог SDH'],
  ['STM', 'Synchronous Transport Module', { hyphenated: true }],
  ['SOH', 'Section Overhead — секционный заголовок', { hyphenated: true }],
  ['POH', 'Path Overhead — маршрутный заголовок', { hyphenated: true }],
  ['PDU', 'Protocol Data Unit — блок данных протокола'],
  ['HEC', 'Header Error Check — контроль ошибок заголовка'],
  ['AAL', 'ATM Adaptation Layer — уровень адаптации ATM'],
  ['BER', 'Bit Error Rate — коэффициент битовых ошибок'],
  ['APS', 'Automatic Protection Switching — автоматическое защитное переключение'],

  // Time / positioning
  ['UTC', 'Universal Time Coordinated — всемирное координированное время'],
  ['GPS', 'Global Positioning System'],

  // Physical / media
  ['UTP', 'Unshielded Twisted Pair — неэкранированная витая пара'],
  ['NRZ', 'Non-Return-to-Zero — код без возврата к нулю'],
  ['PHY', 'Physical layer — физический уровень'],
  ['VLAN', 'Virtual LAN — виртуальная ЛВС'],

  // Wireless / modulation
  ['OFDM', 'Orthogonal Frequency-Division Multiplexing — ортогональное частотное мультиплексирование'],
  ['QAM', 'Quadrature Amplitude Modulation — квадратурная амплитудная модуляция'],
  ['BPSK', 'Binary Phase Shift Keying — двоичная фазовая манипуляция'],
  ['QPSK', 'Quadrature Phase Shift Keying — квадратурная фазовая манипуляция'],
  ['WEP', 'Wired Equivalent Privacy'],
  ['SSID', 'Service Set Identifier — идентификатор сети'],
  ['ISM', 'Industrial, Scientific and Medical — диапазон для промышленных, научных и медицинских устройств'],
  ['RADIUS', 'Remote Authentication Dial-In User Service — сервер удалённой аутентификации'],
  ['EAP', 'Extensible Authentication Protocol'],

  // Mobile
  ['GSM', 'Global System for Mobile'],
  ['GPRS', 'General Packet Radio Service'],
  ['IMS', 'IP Multimedia Subsystem'],
  ['VoIP', 'Voice over IP'],
  ['VoLTE', 'Voice over LTE'],
  ['IoT', 'Internet of Things — интернет вещей'],

  // QoS / operations
  ['QoS', 'Quality of Service — качество обслуживания'],
  ['SLA', 'Service Level Agreement — соглашение об уровне услуг'],
];

const WORD_CHAR = '[A-Za-zА-Яа-яЁё0-9_]';

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRegex(abbr, opts) {
  const base = escapeRegex(abbr);
  const suffix = opts && opts.hyphenated ? '(?:-(?:\\d+|[Nn]))?' : '';
  // Disallow "-letter" continuation for non-hyphenated abbreviations so
  // things like "MAC-адресами", "PDH-мультиплексор" don't get annotated.
  const noHyphenLetter = opts && opts.hyphenated ? '' : '(?!-[A-Za-zА-Яа-яЁё])';
  return new RegExp(`(?<!${WORD_CHAR})${base}${suffix}${noHyphenLetter}(?!${WORD_CHAR})`, 'g');
}

// Check if position `pos` lies inside open parentheses (same line).
function insideParens(text, pos) {
  const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
  let depth = 0;
  for (let i = lineStart; i < pos; i++) {
    const c = text[i];
    if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
  }
  return depth > 0;
}

function firstFreeMatch(text, abbr, opts) {
  const re = buildRegex(abbr, opts);
  let m;
  while ((m = re.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;

    // Skip if already followed by optional whitespace + "("
    if (/^\s*\(/.test(text.slice(end, end + 4))) continue;

    // Skip if inside an unclosed parenthesis on same line
    if (insideParens(text, start)) continue;

    // Skip markdown heading / blockquote / italic source lines
    const lineStart = text.lastIndexOf('\n', start) + 1;
    const lineEnd = text.indexOf('\n', end);
    const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
    if (/^#/.test(line)) continue;
    if (/^>/.test(line)) continue;
    if (/^\*Источник/.test(line)) continue;

    return end;
  }
  return -1;
}

// Detect whether an abbrev has been explained inline somewhere:
// look for pattern `ABBR (substantial paren content)`.
function hasInlineExplanation(text, abbr, opts) {
  const re = buildRegex(abbr, opts);
  let m;
  while ((m = re.exec(text)) !== null) {
    const end = m.index + m[0].length;
    const tail = text.slice(end, end + 200);
    const pm = /^\s*\(([^)]{10,})\)/.exec(tail);
    if (!pm) continue;
    const inside = pm[1];
    // Treat as explanation if it contains a letter run of 5+ chars or
    // two alphabetic words separated by a space (skips purely numeric / unit parens).
    if (/[A-Za-zА-Яа-яЁё]{5,}/.test(inside) && /[A-Za-zА-Яа-яЁё]+\s+[A-Za-zА-Яа-яЁё]+/.test(inside)) {
      return true;
    }
  }
  return false;
}

let added = 0;
const alreadyExplained = [];
const notFound = [];

for (const entry of abbrs) {
  const abbr = entry[0];
  const expl = entry[1];
  const opts = entry[2] || {};
  if (hasInlineExplanation(md, abbr, opts)) {
    alreadyExplained.push(abbr);
    continue;
  }
  const end = firstFreeMatch(md, abbr, opts);
  if (end === -1) {
    if (md.includes(abbr)) alreadyExplained.push(abbr);
    else notFound.push(abbr);
    continue;
  }
  md = md.slice(0, end) + ` (${expl})` + md.slice(end);
  added++;
}

fs.writeFileSync(SRC, md, 'utf-8');
console.log(`Inserted ${added} decipherments.`);
if (alreadyExplained.length) console.log(`Skipped (already in parens nearby or all inside parens): ${alreadyExplained.join(', ')}`);
if (notFound.length) console.log(`Not found in text: ${notFound.join(', ')}`);
