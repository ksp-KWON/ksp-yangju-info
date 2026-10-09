/**
 * pipeline-utils.js
 * 자동글쓰기 파이프라인 공통 유틸리티
 * — sleep, .env.local 로드, POSTS_DIR 상수를 이 파일 하나로 통합 관리
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const dns  = require('dns');

if (dns && dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// ── .env.local 로드 (파이프라인 전역 1회만 실행) ─────────────────────────────
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)?\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = (m[2] ?? '').replace(/(^['"]|['"]$)/g, '').trim();
    }
  });
}

// ── 공통 상수 ────────────────────────────────────────────────────────────────
const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');
const MIN_SOURCE_CHARS = 100;

/**
 * HTML 엔티티 및 기호 복원 표준 함수 (수집 시 텍스트 깨짐 및 노이즈 원천 차단)
 */
function decodeHtmlEntities(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&middot;/g, '·')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\\?u203B/g, '※');
}

// ── 공통 원천 분량 판정 유틸 ────────────────────────────────────────────────
function getCleanSourceText(item) {
  if (!item) return '';
  if (typeof item === 'string') return decodeHtmlEntities(item).replace(/<[^>]+>/g, '').replace(/\s+/g, '');
  const raw = item.intro || item.description || item.content || [
    item.summary,
    item.target,
    item.location,
    item.서비스목적요약,
    item.지원내용,
    item.지원대상,
    item.선정기준
  ].filter(Boolean).join(' ');
  return decodeHtmlEntities(String(raw)).replace(/<[^>]+>/g, '').replace(/\s+/g, '');
}

function isSourceSufficient(item) {
  return getCleanSourceText(item).length >= MIN_SOURCE_CHARS;
}

// ── 공통 유틸 ────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function safeFetch(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
  };

  const finalOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options?.headers || {})
    },
    signal: controller.signal
  };

  try {
    return await fetch(url, finalOptions);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Fetch timeout after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

// ── 원천 팩트 숫자 토큰 추출 및 검증기 ──────────────────────────────────────────
function extractSourceTokens(sourceRaw) {
  const text = typeof sourceRaw === 'string' ? sourceRaw : JSON.stringify(sourceRaw);
  const clean = text.replace(/,/g, '');
  const tokens = new Set();

  // 1) HH:MM (시간 및 분 분해)
  const timeMatches = clean.match(/\b\d{1,2}\s*:\s*\d{2}\b/g) || [];
  timeMatches.forEach(t => {
    const norm = t.replace(/\s+/g, '');
    tokens.add(norm);
    const [hh, mm] = norm.split(':');
    tokens.add(`${parseInt(hh, 10)}시`);
    if (mm !== '00') {
      tokens.add(`${parseInt(mm, 10)}분`);
    }
  });

  // 2) 숫자 + 단위 쌍 (시·분·명·석·원·번·호·층·매·가구)
  const unitMatches = clean.match(/(\d+)\s*(시(?![\w가-힣])|분|명|석|원|번|호|층|매|가구)/g) || [];
  unitMatches.forEach(u => {
    tokens.add(u.replace(/\s+/g, ''));
  });

  return { tokens, compactText: clean.replace(/\s+/g, '') };
}

function validateSourceNumbers(markdownBody, sourceRaw) {
  const bodyOnly = markdownBody.replace(/^---[\s\S]*?---\s*/, '');
  const { tokens: validTokens, compactText } = extractSourceTokens(sourceRaw);

  const violations = [];

  // 1) HH:MM 검사
  const timeRegex = /\b(\d{1,2})\s*:\s*(\d{2})\b/g;
  let tm;
  while ((tm = timeRegex.exec(bodyOnly)) !== null) {
    const rawTime = tm[0];
    const normTime = rawTime.replace(/\s+/g, '');
    if (!validTokens.has(normTime) && !compactText.includes(normTime)) {
      violations.push(rawTime.trim());
    }
  }

  // 2) 숫자 + 단위 쌍 (시·분·명·석·원·번·호·층·매·가구)
  // 연·월·일·부·회·차는 정규식 자체에 미포함되어 자동 제외
  const unitRegex = /(\d+[\d,]*)\s*(시(?![\w가-힣])|분|명|석|원|번|호|층|매|가구)/g;
  let um;
  while ((um = unitRegex.exec(bodyOnly)) !== null) {
    const rawToken = um[0];
    const num = um[1].replace(/,/g, '').replace(/\s+/g, '');
    const unit = um[2];
    const normToken = `${num}${unit}`;

    if (!validTokens.has(normToken) && !compactText.includes(normToken)) {
      violations.push(rawToken.trim());
    }
  }

  return Array.from(new Set(violations));
}

module.exports = {
  POSTS_DIR,
  MIN_SOURCE_CHARS,
  decodeHtmlEntities,
  getCleanSourceText,
  isSourceSufficient,
  sleep,
  safeFetch,
  extractSourceTokens,
  validateSourceNumbers
};


