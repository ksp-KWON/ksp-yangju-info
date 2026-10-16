/**
 * pipeline-utils.js
 * 자동글쓰기 파이프라인 공통 유틸리티
 * — sleep, .env.local 로드, POSTS_DIR 상수를 이 파일 하나로 통합 관리
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const dns  = require('dns');
const tls  = require('tls');
const zlib = require('zlib');

if (dns && dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// ── TLS 중간 인증서 로드 (ui4u.go.kr 등 중간 체인 보완, TLS 검증 유지) ─────────
const certPath = path.join(process.cwd(), 'scripts', 'certs', 'ui4u-intermediate.pem');
let customDispatcher = null;
let customFetch = null;
if (fs.existsSync(certPath)) {
  try {
    const undici = require('undici');
    const pem = fs.readFileSync(certPath, 'utf8');
    customDispatcher = new undici.Agent({
      connect: {
        ca: [...tls.rootCertificates, pem]
      }
    });
    customFetch = undici.fetch;
  } catch (err) {
    console.warn('[pipeline-utils] ui4u TLS intermediate agent creation failed:', err && err.message ? err.message : String(err));
  }
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
  const raw = item.sourceBody || item.intro || item.description || item.content || [
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
    const isUi4u = customDispatcher && customFetch && (typeof url === 'string' && url.includes('ui4u.go.kr'));
    const fetchFn = isUi4u ? customFetch : fetch;
    if (isUi4u && !fetchOpts.dispatcher) {
      fetchOpts.dispatcher = customDispatcher;
    }
    return await fetchFn(url, fetchOpts);
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

  function addTimeVariants(h24, rawM, targetSet, originalRawH) {
    const hh = h24.toString().padStart(2, '0');
    const mm = rawM.toString().padStart(2, '0');

    // HH:MM (24시간제)
    targetSet.add(`${hh}:${mm}`);
    targetSet.add(`${h24}:${mm}`);

    // 시 단위
    targetSet.add(`${h24}시`);
    targetSet.add(`${hh}시`);
    if (originalRawH !== undefined) {
      targetSet.add(`${originalRawH}시`);
      targetSet.add(`${originalRawH.toString().padStart(2, '0')}시`);
    }

    // HHMM
    targetSet.add(`${hh}${mm}`);

    // 분 단위
    if (rawM > 0) {
      targetSet.add(`${rawM}분`);
      targetSet.add(`${mm}분`);
    }
  }

  // (가)-1: 한국어 시각 표현 (오전|오후|낮|밤|새벽)?\s*(\d{1,2})\s*시(\s*(\d{1,2})\s*분)?
  const korTimeRegex = /(오전|오후|낮|밤|새벽)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/g;
  let kt;
  while ((kt = korTimeRegex.exec(clean)) !== null) {
    const prefix = kt[1] || '';
    const rawH = parseInt(kt[2], 10);
    const rawM = kt[3] !== undefined ? parseInt(kt[3], 10) : 0;

    if (rawH < 0 || rawH > 24 || rawM < 0 || rawM > 59) continue;

    let h24 = rawH;
    if (prefix === '오후' || prefix === '밤') {
      if (rawH < 12) h24 = rawH + 12;
    } else if (prefix === '오전' || prefix === '새벽') {
      if (rawH === 12) h24 = 0;
    } else if (prefix === '낮') {
      if (rawH === 12) h24 = 12;
    }

    addTimeVariants(h24, rawM, tokens, rawH);
  }

  // (가)-2: 소스의 (\d{2})(\d{2})\s*[-~]\s*(\d{2})(\d{2}) 구간 표기 (예: 1000-2100)
  const rangeRegex = /\b(\d{2})(\d{2})\s*[-~]\s*(\d{2})(\d{2})\b/g;
  let rm;
  while ((rm = rangeRegex.exec(clean)) !== null) {
    const h1 = parseInt(rm[1], 10), m1 = parseInt(rm[2], 10);
    const h2 = parseInt(rm[3], 10), m2 = parseInt(rm[4], 10);

    if (h1 >= 0 && h1 <= 23 && m1 >= 0 && m1 <= 59 &&
        h2 >= 0 && h2 <= 23 && m2 >= 0 && m2 <= 59) {
      addTimeVariants(h1, m1, tokens, h1);
      addTimeVariants(h2, m2, tokens, h2);
    }
  }

  // (가)-3: 단독 (\d{4}) 시각 후보 (0000~2359 범위만, 영업|운영|시간 근처 또는 10자 이내 테스트 문자열)
  const singleRegex = /\b(\d{2})(\d{2})\b/g;
  let sm;
  while ((sm = singleRegex.exec(clean)) !== null) {
    const idx = sm.index;

    // "2026년" 처럼 년, 월, 일, 호, 번지 뒤에 붙은 것은 제외
    const afterChar = clean.slice(idx + 4, idx + 6);
    if (/^[년월일호번]/.test(afterChar)) continue;

    const h = parseInt(sm[1], 10);
    const m = parseInt(sm[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      const start = Math.max(0, idx - 20);
      const end = Math.min(clean.length, idx + 4 + 20);
      const surrounding = clean.slice(start, end);
      const isTimeContext = /영업|운영|시간|[-~]/.test(surrounding) || (clean.length <= 10 && !/년/.test(clean));

      if (isTimeContext) {
        addTimeVariants(h, m, tokens, h);
      }
    }
  }

  // 1) HH:MM (시간 및 분 분해)
  const timeMatches = clean.match(/\b\d{1,2}\s*:\s*\d{2}\b/g) || [];
  timeMatches.forEach(t => {
    const norm = t.replace(/\s+/g, '');
    tokens.add(norm);
    const [hh, mm] = norm.split(':');
    const h = parseInt(hh, 10);
    const m = parseInt(mm, 10);
    tokens.add(`${h}시`);
    tokens.add(`${h.toString().padStart(2, '0')}시`);
    if (mm !== '00') {
      tokens.add(`${m}분`);
      tokens.add(`${mm}분`);
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
    const [hh, mm] = normTime.split(':');
    const h24 = parseInt(hh, 10);
    const mVal = parseInt(mm, 10);
    const padTime = `${h24.toString().padStart(2, '0')}:${mVal.toString().padStart(2, '0')}`;

    if (!validTokens.has(normTime) && !validTokens.has(padTime) && !compactText.includes(normTime)) {
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
    const normToken = `${num}${unit.replace(/\s+/g, '')}`;

    let isMatch = validTokens.has(normToken) || compactText.includes(normToken);

    // 시 단위 추가 정규화 일치 검사 (예: 본문 '09시' <-> 토큰 '9시')
    if (!isMatch && unit.startsWith('시')) {
      const h = parseInt(num, 10);
      if (validTokens.has(`${h}시`) || validTokens.has(`${h.toString().padStart(2, '0')}시`)) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      violations.push(rawToken.trim());
    }
  }

  return Array.from(new Set(violations));
}

/**
 * 무의존성 ZIP Central Directory 파서 (B단계 표준)
 * EOCD(0x06054b50) -> Central Directory(0x02014b50) 순회
 * [보완 1] 불필요한 엔트리 압축 해제 스킵: Contents/section\d+.xml 패턴만 zlib.inflateRawSync 수행
 * @param {Buffer} buffer
 * @returns {Array<{filename: string, text: string}>}
 */
function parseZipCentralDirectory(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 22) {
    return [];
  }

  // 1. EOCD 시그니처(0x06054b50) 역방향 탐색
  let eocdOffset = -1;
  const maxSearch = Math.min(buffer.length, 65535 + 22);
  const searchStart = buffer.length - 22;
  const searchEnd = buffer.length - maxSearch;

  for (let i = searchStart; i >= searchEnd && i >= 0; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) return [];

  const cdTotalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const cdSize = buffer.readUInt32LE(eocdOffset + 12);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

  if (cdOffset + cdSize > buffer.length) return [];

  let currOffset = cdOffset;
  const sections = [];

  for (let i = 0; i < cdTotalEntries && currOffset < buffer.length - 46; i++) {
    const sig = buffer.readUInt32LE(currOffset);
    if (sig !== 0x02014b50) break;

    const compressionMethod = buffer.readUInt16LE(currOffset + 10);
    const compressedSize = buffer.readUInt32LE(currOffset + 20);
    const filenameLen = buffer.readUInt16LE(currOffset + 28);
    const extraLen = buffer.readUInt16LE(currOffset + 30);
    const commentLen = buffer.readUInt16LE(currOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(currOffset + 42);

    const filename = buffer.toString('utf8', currOffset + 46, currOffset + 46 + filenameLen);

    // [보완 1] 불필요한 엔트리 압축 해제 스킵: header.xml, BinData/* 이미지 압축 해제 방지
    if (!/^Contents\/section\d+\.xml$/i.test(filename)) {
      currOffset += 46 + filenameLen + extraLen + commentLen;
      continue;
    }

    if (localHeaderOffset + 30 <= buffer.length && buffer.readUInt32LE(localHeaderOffset) === 0x04034b50) {
      const localFilenameLen = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localFilenameLen + localExtraLen;
      const dataEnd = dataStart + compressedSize;

      if (dataEnd <= buffer.length) {
        const compressedData = buffer.subarray(dataStart, dataEnd);
        let xmlStr = '';
        try {
          if (compressionMethod === 8) {
            xmlStr = zlib.inflateRawSync(compressedData).toString('utf8');
          } else if (compressionMethod === 0) {
            xmlStr = compressedData.toString('utf8');
          }
        } catch {}

        if (xmlStr) {
          const cleanedXml = xmlStr
            .replace(/<hp:p\b[^>]*>/gi, '\n')
            .replace(/<\/hp:p>/gi, '\n')
            .replace(/<hp:tc\b[^>]*>/gi, '\t')
            .replace(/<hp:t\b[^>]*>([\s\S]*?)<\/hp:t>/gi, '$1')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");

          const trimmed = cleanedXml
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean)
            .join('\n');

          if (trimmed) {
            sections.push({ filename, text: trimmed });
          }
        }
      }
    }

    currOffset += 46 + filenameLen + extraLen + commentLen;
  }

  return sections;
}

/**
 * HWPX 텍스트 추출 통합 함수 (Central Directory 기반, 최대 6,000자 상한)
 * @param {Buffer} buffer
 * @returns {string}
 */
function extractHwpxText(buffer) {
  const sections = parseZipCentralDirectory(buffer);
  if (!sections || sections.length === 0) return '';
  return sections.map(s => s.text).join('\n\n').slice(0, 6000).trim();
}

// 기존 인터페이스 하위 호환 별칭
const extractTextFromHwpxBuffer = extractHwpxText;

/**
 * 24바이트 순수 이미지 헤더 치수 파서 (PNG, JPEG, WebP, GIF)
 * @param {Buffer} buffer
 * @returns {{width: number, height: number, mime: string}|null}
 */
function getImageDimensions(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 24) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), mime: 'image/png' };
  }

  // GIF: GIF87a / GIF89a
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8), mime: 'image/gif' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xFF) { offset++; continue; }
      const marker = buffer[offset + 1];
      if (
        (marker >= 0xC0 && marker <= 0xC3) ||
        (marker >= 0xC5 && marker <= 0xC7) ||
        (marker >= 0xC9 && marker <= 0xCB) ||
        (marker >= 0xCD && marker <= 0xCF)
      ) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
          mime: 'image/jpeg'
        };
      }
      if (marker === 0xD9 || marker === 0xDA) break;
      const length = buffer.readUInt16BE(offset + 2);
      offset += 2 + length;
    }
  }

  // WebP: RIFF ... WEBP
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const type = buffer.toString('ascii', 12, 16);
    if (type === 'VP8 ') {
      return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff, mime: 'image/webp' };
    }
    if (type === 'VP8L') {
      const b0 = buffer[21], b1 = buffer[22], b2 = buffer[23], b3 = buffer[24];
      return {
        width: 1 + (((b1 & 0x3f) << 8) | b0),
        height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
        mime: 'image/webp'
      };
    }
    if (type === 'VP8X') {
      return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3), mime: 'image/webp' };
    }
  }

  return null;
}

/**
 * HWPX 첨부파일 우선순위 정렬 및 다운로드/텍스트 병합 (최대 2개, 6,000자 상한)
 * [보완 2] 공고|안내|요강|계획|개요|모집|선발 1순위, 신청서|서식|양식|동의서 후순위
 * @param {Array<{url: string, filename: string}>} hwpxLinks
 * @param {boolean} isUi4u
 * @returns {Promise<string>}
 */
async function fetchHwpxAttachments(hwpxLinks, isUi4u = false) {
  if (!hwpxLinks || hwpxLinks.length === 0) return '';

  const priorityRegex = /공고|안내|요강|계획|개요|선발|모집|기준/i;
  const depriorityRegex = /신청서|서식|양식|동의서|위임장|확인서/i;

  const sorted = [...hwpxLinks].sort((a, b) => {
    const aPrio = priorityRegex.test(a.filename) ? 1 : (depriorityRegex.test(a.filename) ? -1 : 0);
    const bPrio = priorityRegex.test(b.filename) ? 1 : (depriorityRegex.test(b.filename) ? -1 : 0);
    return bPrio - aPrio;
  }).slice(0, 2);

  const texts = [];
  for (const item of sorted) {
    try {
      const fetchOpts = {};
      if (isUi4u && customDispatcher) {
        fetchOpts.dispatcher = customDispatcher;
      }
      const res = await safeFetch(item.url, fetchOpts, 10000);
      if (res && res.status === 200) {
        const buf = Buffer.from(await res.arrayBuffer());
        const extracted = extractHwpxText(buf);
        if (extracted && extracted.trim()) {
          texts.push(`[${item.filename}]\n${extracted.trim()}`);
        }
      }
    } catch {}
  }

  return texts.join('\n\n').slice(0, 6000).trim();
}

/**
 * 순수 24바이트 이미지 치수 파서 및 황금 비율 필터
 * 조건: 40KB 이상, height >= 580, width / height <= 1.45 (최대 5장, 누적 용량 4MB 이내)
 * @param {string[]} imageUrls
 * @returns {Promise<Array<{url: string, mimeType: string, base64: string, width: number, height: number, ratio: number}>>}
 */
async function extractAndFilterImages(imageUrls) {
  const validImages = [];
  let totalBytes = 0;
  const MAX_BYTES = 4 * 1024 * 1024;
  const MAX_IMAGES = 5;

  for (const url of imageUrls) {
    if (validImages.length >= MAX_IMAGES) break;
    try {
      const fetchOpts = {};
      if (url.includes('pstatic.net') || url.includes('naver.com')) {
        fetchOpts.headers = { 'Referer': 'https://blog.naver.com/' };
      }
      const res = await safeFetch(url, fetchOpts, 8000);
      if (!res || res.status !== 200) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 40 * 1024) continue; // 40KB 미만 배너/아이콘 차단
      if (totalBytes + buf.length > MAX_BYTES) break;

      const dim = getImageDimensions(buf);
      if (!dim || !dim.width || !dim.height) continue;
      const ratio = dim.width / dim.height;

      // 황금 비율 엄격 기준: height >= 580, width / height <= 1.45 (가로 행사 사진 차단, 카드뉴스·포스터 선별)
      if (dim.height >= 580 && ratio <= 1.45) {
        validImages.push({
          url,
          mimeType: dim.mime,
          base64: buf.toString('base64'),
          width: dim.width,
          height: dim.height,
          ratio: Number(ratio.toFixed(2))
        });
        totalBytes += buf.length;
      }
    } catch {}
  }
  return validImages;
}

/**
 * 소스 본문 수집 함수 (B-1/B-2/B단계 표준)
 * @param {string} url - RSS 항목의 link
 * @returns {Promise<{text: string, rawBodyText: string, hwpxText: string, validImages: Array, imageCount: number, attachments: string[]}>}
 */
async function crawlSourceBody(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return { text: '', rawBodyText: '', hwpxText: '', validImages: [], imageCount: 0, attachments: [] };
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
    const isUi4u = customDispatcher && customFetch && (typeof targetUrl === 'string' && targetUrl.includes('ui4u.go.kr'));
    const fetchFn = isUi4u ? customFetch : fetch;
    if (isUi4u) {
      fetchOptions.dispatcher = customDispatcher;
    }

    const res = await fetchFn(targetUrl, fetchOptions);
    clearTimeout(timeoutId);

    if (res.status !== 200) {
      return { text: '', rawBodyText: '', hwpxText: '', validImages: [], imageCount: 0, attachments: [] };
    }

    const html = await res.text();

    // alert 등으로 삭제/존재하지 않거나 권한 없는 페이지 처리
    if (html.includes("alert('게시판이 삭제되었거나 존재하지 않습니다')") || html.includes('alert("게시판이 삭제되었거나') || html.includes('alert("권한이 없습니다') || html.includes("alert('권한이 없습니다")) {
      return { text: '', rawBodyText: '', hwpxText: '', validImages: [], imageCount: 0, attachments: [] };
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

    // HWPX 첨부파일 링크 정밀 추출 (의정부 eGovFrame fn_egov_downFile 및 네이버 블로그)
    const hwpxCandidates = [];
    const seenHwpxUrls = new Set();

    // 의정부 fn_egov_downFile 패턴
    const downFileRegex = /onclick=["'](?:fn_egov_downFile|fn_egov_downFile_pubc)\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
    while ((match = downFileRegex.exec(html)) !== null) {
      const cleanName = decodeHtmlEntities(match[3] || '').replace(/<[^>]+>/g, '').trim();
      if (/\.hwpx/i.test(cleanName)) {
        const downUrl = `https://www.ui4u.go.kr/cmm/fms/FileDown.do?atchFileId=${match[1]}&fileSn=${match[2]}`;
        if (!seenHwpxUrls.has(downUrl)) {
          seenHwpxUrls.add(downUrl);
          hwpxCandidates.push({ url: downUrl, filename: cleanName });
          attachMatches.push('.hwpx');
        }
      }
    }

    // 2) 일반 및 네이버 블로그 .hwpx 링크 (URL 자체 .hwpx 또는 텍스트/속성에 .hwpx가 있고 URL은 fileDown.do 형태)
    const aTagRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    while ((match = aTagRegex.exec(html)) !== null) {
      const tagAttrs = match[1];
      const tagBody = match[2];

      const hrefMatch = tagAttrs.match(/href=["']([^"']+)["']/i);
      if (!hrefMatch) continue;
      const href = hrefMatch[1];

      const cleanText = decodeHtmlEntities(tagBody || '').replace(/<[^>]+>/g, '').trim();
      const titleMatch = tagAttrs.match(/title=["']([^"']+)["']/i);
      const cleanTitle = titleMatch ? decodeHtmlEntities(titleMatch[1]).trim() : '';

      let isHwpx = false;
      let filename = cleanText || cleanTitle;

      if (/\.hwpx(\b|\?|$)/i.test(href)) {
        isHwpx = true;
        try {
          const decodedHref = decodeURIComponent(href);
          const nameMatch = decodedHref.match(/[^/?#]+\.hwpx/i);
          if (nameMatch) filename = nameMatch[0];
        } catch {}
      } else if (/\.hwpx/i.test(cleanText) || /\.hwpx/i.test(cleanTitle)) {
        isHwpx = true;
        if (!filename || !/\.hwpx/i.test(filename)) {
          filename = cleanTitle || cleanText;
        }
      }

      if (isHwpx) {
        let resolvedUrl = href;
        if (href.startsWith('/')) {
          try {
            const u = new URL(targetUrl);
            resolvedUrl = `${u.origin}${href}`;
          } catch {}
        } else if (!href.startsWith('http')) {
          try {
            const u = new URL(targetUrl);
            resolvedUrl = new URL(href, u.origin).href;
          } catch {}
        }

        if (!seenHwpxUrls.has(resolvedUrl) && resolvedUrl.startsWith('http')) {
          seenHwpxUrls.add(resolvedUrl);
          hwpxCandidates.push({ url: resolvedUrl, filename: filename || '공고문.hwpx' });
          attachMatches.push('.hwpx');
        }
      }
    }

    // HWPX 파일 다운로드 및 텍스트 추출 (최대 2개, 6,000자)
    const hwpxText = hwpxCandidates.length > 0 ? await fetchHwpxAttachments(hwpxCandidates, isUi4u) : '';

    // 본문 컨테이너 추출 (네이버 블로그 및 일반 HTML)
    let container = '';
    if (targetUrl.includes('blog.naver.com') || html.includes('class="se-main-container"') || html.includes('id="postViewArea"')) {
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
        return { text: '', rawBodyText: '', hwpxText: '', validImages: [], imageCount: 0, attachments: [] };
      }
    } else {
      const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
      const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
      const viewContIdx = html.indexOf('class="view_cont"');
      const bodIdx = html.indexOf('class="bod_view"');
      const bbsIdx = html.indexOf('class="bbs_view"');
      const contentIdx = html.indexOf('id="content"');

      if (articleMatch) {
        container = articleMatch[0];
      } else if (mainMatch) {
        container = mainMatch[0];
      } else if (viewContIdx !== -1 || bodIdx !== -1 || bbsIdx !== -1 || contentIdx !== -1) {
        const startIdx = viewContIdx !== -1 ? viewContIdx : (bodIdx !== -1 ? bodIdx : (bbsIdx !== -1 ? bbsIdx : contentIdx));
        const openTagEnd = html.indexOf('>', startIdx);
        const footerIdx = html.indexOf('<footer', startIdx);
        const endIdx = footerIdx !== -1 ? footerIdx : startIdx + 35000;
        container = openTagEnd !== -1 ? html.substring(openTagEnd + 1, endIdx) : html.substring(startIdx, endIdx);
      } else {
        return { text: '', rawBodyText: '', hwpxText: '', validImages: [], imageCount: 0, attachments: [] };
      }
    }

    // 본문 내 이미지 URL 추출 및 고해상도 변환
    const candidateImgUrls = [];
    const seenImgUrls = new Set();
    const imgTagRegex = /<img\b[^>]*>/gi;
    let imgTagMatch;
    let imgMatches = 0;

    while ((imgTagMatch = imgTagRegex.exec(container)) !== null) {
      imgMatches++;
      const tag = imgTagMatch[0];
      const lazyMatch = tag.match(/data-lazy-src=["']([^"']+)["']/i);
      const srcMatch = tag.match(/src=["']([^"']+)["']/i);
      let imgUrl = (lazyMatch ? lazyMatch[1] : (srcMatch ? srcMatch[1] : '')).trim();
      if (!imgUrl) continue;

      if (/sticker|emoticon|profile|static\.naver|dthumb-phinf|btn_|icon_|blank\.gif/i.test(imgUrl)) {
        continue;
      }

      if (imgUrl.startsWith('/')) {
        try {
          const u = new URL(targetUrl);
          imgUrl = `${u.origin}${imgUrl}`;
        } catch {}
      }

      // 네이버 블로그 이미지 고해상도(type=w966) 변환
      if (imgUrl.includes('pstatic.net')) {
        imgUrl = imgUrl.replace(/\?type=[^&]+/, '') + '?type=w966';
      }

      if (!seenImgUrls.has(imgUrl) && imgUrl.startsWith('http') && candidateImgUrls.length < 10) {
        seenImgUrls.add(imgUrl);
        candidateImgUrls.push(imgUrl);
      }
    }

    // 황금 비율 카드뉴스/포스터 이미지 선별 (최대 5장, 4MB)
    const validImages = candidateImgUrls.length > 0 ? await extractAndFilterImages(candidateImgUrls) : [];

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

    // 네비게이션·메뉴 문구가 3개 이상 들어가면 비공고/홈페이지 오염 방지를 위해 빈 문자열 반환
    const navKeywords = ["바로가기", "메뉴", "QUICK", "로그인", "사이트맵", "개인정보처리방침", "COPYRIGHT"];
    let navCount = 0;
    for (const kw of navKeywords) {
      const reg = new RegExp(kw, 'gi');
      const m = clean.match(reg);
      if (m) navCount += m.length;
      if (navCount >= 3) break;
    }
    if (navCount >= 3) {
      return { text: '', rawBodyText: '', hwpxText: '', validImages: [], imageCount: 0, attachments: [] };
    }

    const rawBodyText = clean.slice(0, 12000);
    let text = rawBodyText;

    // HWPX 추출 텍스트가 있으면 즉시 본문 뒤에 표준 결합
    if (hwpxText && hwpxText.trim()) {
      text = text ? `${text}\n\n[첨부 공고문 원문]\n${hwpxText.trim()}` : `[첨부 공고문 원문]\n${hwpxText.trim()}`;
    }

    return {
      text,
      rawBodyText,
      hwpxText: hwpxText || '',
      validImages,
      imageCount: imgMatches,
      attachments: Array.from(new Set(attachMatches))
    };
  } catch {
    clearTimeout(timeoutId);
    return { text: '', rawBodyText: '', hwpxText: '', validImages: [], imageCount: 0, attachments: [] };
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
  parseZipCentralDirectory,
  extractHwpxText,
  extractTextFromHwpxBuffer,
  getImageDimensions,
  fetchHwpxAttachments,
  extractAndFilterImages,
  crawlSourceBody
};


