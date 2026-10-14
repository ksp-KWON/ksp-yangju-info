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

const tls  = require('tls');

// ── TLS 중간 인증서 로드 (ui4u.go.kr 등 중간 체인 보완, TLS 검증 유지) ─────────
const certPath = path.join(process.cwd(), 'scripts', 'certs', 'ui4u-intermediate.pem');
let customDispatcher = null;
if (fs.existsSync(certPath)) {
  try {
    const { Agent } = require('undici');
    const pem = fs.readFileSync(certPath, 'utf8');
    customDispatcher = new Agent({
      connect: {
        ca: [...tls.rootCertificates, pem]
      }
    });
  } catch {}
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
    const fetchOpts = { ...finalOptions };
    if (customDispatcher && !fetchOpts.dispatcher && (typeof url === 'string' && url.includes('ui4u.go.kr'))) {
      fetchOpts.dispatcher = customDispatcher;
    }
    return await fetch(url, fetchOpts);
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
  const unitRegex = /(\d+[\d,]*)\s*(만\s*원|만원|천\s*원|천원|억\s*원|억원|%|시(?![\w가-힣])|분|명|석|원|번|호|층|매|가구)/g;
  const unitMatches = clean.match(unitRegex) || [];
  unitMatches.forEach(u => {
    const compact = u.replace(/\s+/g, '');
    tokens.add(compact);
    const mMan = compact.match(/^(\d+)만원$/);
    if (mMan) {
      const num = parseInt(mMan[1], 10);
      const won = num * 10000;
      tokens.add(`${won}원`);
      tokens.add(`${won.toLocaleString()}원`);
    }
    const mWon = compact.match(/^(\d+)원$/);
    if (mWon) {
      const num = parseInt(mWon[1], 10);
      if (num >= 10000 && num % 10000 === 0) {
        tokens.add(`${num / 10000}만원`);
        tokens.add(`${num / 10000}만 원`);
      }
    }
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
  const unitRegex = /(\d+[\d,]*)\s*(만\s*원|만원|천\s*원|천원|억\s*원|억원|%|시(?![\w가-힣])|분|명|석|원|번|호|층|매|가구)/g;
  let um;
  while ((um = unitRegex.exec(bodyOnly)) !== null) {
    const rawToken = um[0];
    const num = um[1].replace(/,/g, '').replace(/\s+/g, '');
    const unit = um[2];
    const normToken = `${num}${unit.replace(/\s+/g, "")}`;

    if (!validTokens.has(normToken) && !compactText.includes(normToken)) {
      violations.push(rawToken.trim());
    }
  }

  return Array.from(new Set(violations));
}

/**
 * 소스 본문 수집 함수 (B-1/B-2 표준)
 * @param {string} url - RSS 항목의 link
 * @returns {Promise<{text: string, imageCount: number, attachments: string[]}>}
 */
async function crawlSourceBody(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return { text: '', imageCount: 0, attachments: [] };
  }

  // 요청 간 1초 간격 준수
  await sleep(1000);

  let targetUrl = url;
  // 네이버 블로그 PostView iframe URL 처리
  if (url.includes('blog.naver.com') && !url.includes('PostView.naver')) {
    const m = url.match(/blog\.naver\.com\/([^/?#]+)\/(\d+)/);
    if (m) {
      targetUrl = `https://blog.naver.com/PostView.naver?blogId=${m[1]}&logNo=${m[2]}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const fetchOptions = {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    };
    // TLS 중간 인증서가 필요한 특정 공공기관(ui4u.go.kr)에만 검증된 ca dispatcher 적용 (TLS 검증 유지)
    if (customDispatcher && (typeof targetUrl === 'string' && targetUrl.includes('ui4u.go.kr'))) {
      fetchOptions.dispatcher = customDispatcher;
    }

    const res = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeoutId);

    if (res.status !== 200) {
      return { text: '', imageCount: 0, attachments: [] };
    }

    const html = await res.text();

    // alert 등으로 삭제/존재하지 않거나 권한 없는 페이지 처리
    if (html.includes("alert('게시판이 삭제되었거나 존재하지 않습니다')") || html.includes('alert("게시판이 삭제되었거나') || html.includes('alert("권한이 없습니다') || html.includes("alert('권한이 없습니다")) {
      return { text: '', imageCount: 0, attachments: [] };
    }

    // 첨부 링크 검출 (.pdf, .hwp, .hwpx, .xlsx, .zip 등)
    const attachRegex = /href="([^"]+\.(pdf|hwp|hwpx|xlsx|xls|zip|doc|docx)[^"]*)"/gi;
    const attachMatches = [];
    let match;
    while ((match = attachRegex.exec(html)) !== null) {
      const extMatch = match[1].match(/\.(pdf|hwp|hwpx|xlsx|xls|zip|doc|docx)/i);
      if (extMatch) {
        attachMatches.push(extMatch[0].toLowerCase());
      }
    }
    const dlRegex = /href="([^"]*(?:download\.do|fileDown|file_down|fileDownload|attach\.naver\.net|download\.naver)[^"]*)"/gi;
    while ((match = dlRegex.exec(html)) !== null) {
      const ext = (match[1].match(/\.(pdf|hwp|hwpx|xlsx|xls|zip|doc|docx)/i) || [])[0];
      attachMatches.push(ext ? ext.toLowerCase() : '.첨부');
    }

    // 본문 컨테이너 추출 (네이버 블로그 및 일반 HTML)
    let container = '';
    if (targetUrl.includes('blog.naver.com')) {
      const startIdx = html.indexOf('class="se-main-container"');
      const viewIdx = html.indexOf('id="postViewArea"');
      const chosenStart = startIdx !== -1 ? startIdx : viewIdx;
      if (chosenStart !== -1) {
        const footerStart = html.indexOf('<!-- SE_DOC_FOOTER_START -->', chosenStart);
        const postFooter = html.indexOf('class="post-footer', chosenStart);
        const endIdx = footerStart !== -1 ? footerStart : (postFooter !== -1 ? postFooter : html.length);
        const openTagEnd = html.indexOf('>', chosenStart);
        container = openTagEnd !== -1 ? html.substring(openTagEnd + 1, endIdx) : html.substring(chosenStart, endIdx);
      } else {
        // 네이버 블로그 본문 컨테이너 미발견 시 비공고/오염 방지를 위해 빈 문자열 반환
        return { text: '', imageCount: 0, attachments: [] };
      }
    } else {
      const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
      const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
      const viewContIdx = html.indexOf('class="view_cont"');
      const bbsIdx = html.indexOf('class="bbs_view"');
      const contentIdx = html.indexOf('id="content"');

      if (articleMatch) {
        container = articleMatch[0];
      } else if (mainMatch) {
        container = mainMatch[0];
      } else if (viewContIdx !== -1 || bbsIdx !== -1 || contentIdx !== -1) {
        const startIdx = viewContIdx !== -1 ? viewContIdx : (bbsIdx !== -1 ? bbsIdx : contentIdx);
        const openTagEnd = html.indexOf('>', startIdx);
        const footerIdx = html.indexOf('<footer', startIdx);
        const endIdx = footerIdx !== -1 ? footerIdx : startIdx + 35000;
        container = openTagEnd !== -1 ? html.substring(openTagEnd + 1, endIdx) : html.substring(startIdx, endIdx);
      } else {
        // 본문 컨테이너 미발견 시 <body> 전체로 대체하지 않고 비공고/홈페이지 오염 방지를 위해 빈 문자열 반환 (B-2)
        return { text: '', imageCount: 0, attachments: [] };
      }
    }

    // 이미지 개수만 카운트 (URL은 수집하지 않음)
    const imgMatches = (container.match(/<img\b[^>]*>/gi) || []).length;

    // 불필요한 태그 제거 및 텍스트 정제
    let clean = container
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<[^>]+>/g, ' ');

    clean = decodeHtmlEntities(clean)
      .replace(/\s+/g, ' ')
      .trim();

    // 네비게이션·메뉴 문구가 3개 이상 들어가면 비공고/홈페이지 오염 방지를 위해 빈 문자열 반환 (B-2)
    const navKeywords = ["바로가기", "메뉴", "QUICK", "로그인", "사이트맵", "개인정보처리방침", "COPYRIGHT"];
    let navCount = 0;
    for (const kw of navKeywords) {
      const reg = new RegExp(kw, 'gi');
      const m = clean.match(reg);
      if (m) navCount += m.length;
      if (navCount >= 3) break;
    }
    if (navCount >= 3) {
      return { text: '', imageCount: 0, attachments: [] };
    }

    // 최대 12,000자로 절단
    const text = clean.slice(0, 12000);

    return {
      text,
      imageCount: imgMatches,
      attachments: Array.from(new Set(attachMatches))
    };
  } catch {
    clearTimeout(timeoutId);
    return { text: '', imageCount: 0, attachments: [] };
  }
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
  validateSourceNumbers,
  crawlSourceBody
};


