/**
 * scripts/generate-blog-post.js
 * 의정부 건강·생활 정보 포털 [공공데이터 자동 포스팅 파이프라인 엔진]
 * 
 * 헌법 준수 (.agents/AGENTS.md)
 * Tier 1: 경기24 공공데이터 포털 API (신규 복지·지원금 공고 최우선 포스팅)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { callGemini, isAllQuotaExhausted } = require('./gemini-helper');
const { sleep, MIN_SOURCE_CHARS, getCleanSourceText, isSourceSufficient, validateSourceNumbers } = require('./pipeline-utils');
const { generateSourceId, getExistingSourceIds, saveMarkdownPost, makeSlug, getKSTDateString } = require('./post-utils');
const {
  PLAN_SCHEMA,
  CONTENT_SCHEMA,
  getRandomAngle,
  buildPlanPrompt,
  buildContentPrompt
} = require('./prompt-builder');

const CITY_RSS_PATH = path.join(process.cwd(), 'public/data/city-rss.json');
const LOCAL_INFO_PATH = path.join(process.cwd(), 'public/data/local-info.json');

const MAX_POSTS_PER_RUN = 1;
const MAX_CONTENT_CALLS_PER_RUN = 2;
let totalContentCalls = 0;

// ── 마감일자 결정적 추출 헬퍼 (LLM 개입 배제) ──────────────────────────
function extractExpiryDate(text) {
  if (!text || typeof text !== 'string') return undefined;
  let cleaned = text.replace(/\([월화수목금토일]\)/g, ' ');
  cleaned = cleaned.replace(/\d{1,2}\s*:\s*\d{2}/g, ' ').replace(/\d{1,2}시(\s*\d{1,2}분)?/g, ' ');
  const fullDateRegex = /(?<!\d)(?:(\d{4})|(\d{2}))\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*일?/g;
  const dates = [];
  let m;
  let firstYear = null;
  let lastFullYear = null;
  let lastFullMonth = null;
  let lastFullDay = null;
  let lastMatchEnd = 0;

  while ((m = fullDateRegex.exec(cleaned)) !== null) {
    const mNum = parseInt(m[3], 10);
    const dNum = parseInt(m[4], 10);
    if (mNum < 1 || mNum > 12 || dNum < 1 || dNum > 31) continue;
    const rawYear = m[1] || m[2];
    const year = rawYear.length === 2 ? ('20' + rawYear) : rawYear;
    const month = m[3].padStart(2, '0');
    const day = m[4].padStart(2, '0');
    dates.push({ str: `${year}-${month}-${day}` });
    if (!firstYear) firstYear = year;
    lastFullYear = year;
    lastFullMonth = month;
    lastFullDay = dNum;
    lastMatchEnd = fullDateRegex.lastIndex;
  }

  if (firstYear) {
    const afterText = cleaned.slice(lastMatchEnd);
    let matchedPartial = false;
    const partialDateRegex = /(?:[~～∼\-–—,]|\s+至\s*)\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*일?/g;
    let pm;
    while ((pm = partialDateRegex.exec(afterText)) !== null) {
      const pmNum = parseInt(pm[1], 10);
      const pdNum = parseInt(pm[2], 10);
      if (pmNum < 1 || pmNum > 12 || pdNum < 1 || pdNum > 31) continue;
      const month = pm[1].padStart(2, '0');
      const day = pm[2].padStart(2, '0');
      dates.push({ str: `${firstYear}-${month}-${day}` });
      matchedPartial = true;
    }

    if (!matchedPartial && lastFullYear && lastFullMonth) {
      const dayOnlyRegex = /^\s*\.?\s*(?:[~～∼\-–—,]|\s+至\s*)\s*(\d{1,2})(?:\s*일|\.(?!\d)|(?=\s|$))/;
      const dm = afterText.match(dayOnlyRegex);
      if (dm) {
        const ddNum = parseInt(dm[1], 10);
        if (ddNum >= 1 && ddNum <= 31 && (!lastFullDay || ddNum >= lastFullDay)) {
          const day = dm[1].padStart(2, '0');
          dates.push({ str: `${lastFullYear}-${lastFullMonth}-${day}` });
        }
      }
    }
  }

  if (dates.length === 0) return undefined;
  dates.sort((a, b) => a.str.localeCompare(b.str));
  return dates[dates.length - 1].str;
}

// ── 공통 포스팅 생성 및 마크다운 저장 엔진 ─────────────────────────────
async function generateAndSavePost(targetItem, tierLabel) {
  if (totalContentCalls >= MAX_CONTENT_CALLS_PER_RUN) {
    console.log(`  -> 실행당 최대 본문 생성 횟수(${MAX_CONTENT_CALLS_PER_RUN}회)에 도달하여 추가 생성을 건너뜁니다.`);
    return null;
  }

  const sourceId = targetItem.sourceId || generateSourceId(targetItem.title);
  console.log(`  -> [${tierLabel}] 타깃 선정: "${targetItem.title}" (Source ID: ${sourceId})`);

  const angle = getRandomAngle();
  const plan = await callGemini(buildPlanPrompt(targetItem), PLAN_SCHEMA, 'lite');
  await sleep(2000);

  totalContentCalls++;
  const content = await callGemini(buildContentPrompt(targetItem, plan, angle), CONTENT_SCHEMA, 'flash');

  // 원천 팩트 숫자 토큰 무결성 검증 (저장 전 수행)
  const violations = validateSourceNumbers(content.markdownContent, targetItem);
  if (violations.length > 0) {
    console.warn(`  ❌ [원천 팩트 숫자 위반] "${targetItem.title}" 원천 미존재 토큰: ${violations.join(', ')} -> 포스팅 스킵`);
    return null;
  }

  const today = getKSTDateString();
  const slug = makeSlug(plan.frontmatter.title || targetItem.title);
  const fileName = `${today}-${slug}.md`;

  const saved = saveMarkdownPost(fileName, {
    title: plan.frontmatter.title,
    date: getKSTDateString() + 'T09:00:00+09:00',
    summary: plan.frontmatter.summary,
    category: plan.frontmatter.category,
    tags: plan.frontmatter.tags,
    sourceId: sourceId,
    sourceLink: targetItem.link || 'https://www.ui4u.go.kr',
    ...(targetItem.expiresAt ? { expiresAt: targetItem.expiresAt } : {})
  }, content.markdownContent);

  return saved && saved.filePath ? saved.filePath : fileName;
}

/**
 * Tier 1 RSS 후보 선별 필터 (원천 분량 100자 이상 검증)
 */
function filterTier1Candidates(queue) {
  return (queue || []).filter(item => {
    if (!item || !item.title) return false;
    if (!isSourceSufficient(item)) {
      const cleanLen = getCleanSourceText(item).length;
      console.log(`  [분량 미달 제외] "${item.title}" (원천 글자수: ${cleanLen}자 < ${MIN_SOURCE_CHARS}자)`);
      return false;
    }
    return true;
  });
}

// ── [Tier 1] 의정부시청 공식 RSS 최우선 포스팅 ─────────────────────
async function runTier1CityRss(limit = MAX_POSTS_PER_RUN) {
  if (limit <= 0 || totalContentCalls >= MAX_CONTENT_CALLS_PER_RUN) return { attempted: 0, published: [] };
  console.log('\n[Tier 1] 의정부시청 공식 RSS 미발행 항목 검색 중...');
  if (!fs.existsSync(CITY_RSS_PATH)) {
    console.log('  -> city-rss.json 파일이 없습니다.');
    return { attempted: 0, published: [] };
  }

  const existingSourceIds = getExistingSourceIds();
  const rssQueue = JSON.parse(fs.readFileSync(CITY_RSS_PATH, 'utf8'));

  const qualified = filterTier1Candidates(rssQueue);
  const pending = qualified.filter(item => {
    const sourceId = item.sourceId || generateSourceId(item.title);
    return !existingSourceIds.has(sourceId);
  }).slice(0, MAX_CONTENT_CALLS_PER_RUN);

  if (pending.length === 0) {
    console.log('  -> 시청 RSS에 미발행된 신규 소식이 없습니다.');
    return { attempted: 0, published: [] };
  }

  console.log(`  -> 미발행 신규 소식 ${pending.length}건 배정 (최대 ${limit}건 발행 목표). 생성 시작...`);
  const published = [];
  for (let i = 0; i < pending.length; i++) {
    if (published.length >= limit) break;
    if (totalContentCalls >= MAX_CONTENT_CALLS_PER_RUN) break;
    if (isAllQuotaExhausted()) break;
    const item = pending[i];
    item.expiresAt = extractExpiryDate(item.description);
    try {
      console.log(`\n[${i + 1}/${pending.length}] 글 작성 진행: "${item.title}"`);
      const fileName = await generateAndSavePost(item, 'Tier 1: 시청 공식 RSS');
      if (fileName) {
        published.push(fileName);
        existingSourceIds.add(item.sourceId || generateSourceId(item.title));
        await sleep(2500); // Gemini API 레이트 리밋 방지 쾌적 대기
      }
    } catch (err) {
      console.error(`  ❌ "${item.title}" 생성 실패:`, err.message);
      if (err.code === 'QUOTA_EXHAUSTED' || isAllQuotaExhausted()) break;
    }
  }

  return { attempted: pending.length, published };
}

/**
 * Tier 2 공공데이터 후보 선별 필터 (원천 분량 100자 이상 검증)
 */
function filterTier2Candidates(items) {
  return (items || []).filter(item => {
    if (!item || !item.title) return false;
    if (!isSourceSufficient(item)) {
      const cleanLen = getCleanSourceText(item).length;
      console.log(`  [분량 미달 제외] "${item.title}" (원천 글자수: ${cleanLen}자 < ${MIN_SOURCE_CHARS}자)`);
      return false;
    }
    return true;
  });
}

// ── [Tier 2] 경기24 공공데이터(local-info.json) 보조 포스팅 ────────────
async function runTier2LocalInfo(limit = MAX_POSTS_PER_RUN) {
  if (limit <= 0) return { attempted: 0, published: [] };
  console.log('\n[Tier 2] 경기24 공공데이터 미발행 항목 검색 중...');
  if (!fs.existsSync(LOCAL_INFO_PATH)) {
    console.log('  -> local-info.json 파일이 없습니다.');
    return { attempted: 0, published: [] };
  }

  const existingSourceIds = getExistingSourceIds();
  const localInfo = JSON.parse(fs.readFileSync(LOCAL_INFO_PATH, 'utf8'));
  const allItems = [...(localInfo.events || []), ...(localInfo.benefits || [])];

  const qualified = filterTier2Candidates(allItems);
  const pending = qualified.filter(item => {
    const sourceId = generateSourceId(item.title);
    return !existingSourceIds.has(sourceId);
  }).slice(0, limit);

  if (pending.length === 0) {
    console.log('  -> 경기24 공공데이터에 미발행된 신규 공고가 없습니다.');
    return { attempted: 0, published: [] };
  }

  console.log(`  -> 미발행 경기24 공공데이터 ${pending.length}건 배정 (최대 ${limit}건). 생성 시작...`);
  const published = [];
  for (let i = 0; i < pending.length; i++) {
    if (published.length >= limit) break;
    if (totalContentCalls >= MAX_CONTENT_CALLS_PER_RUN) break;
    if (isAllQuotaExhausted()) break;
    const item = pending[i];
    try {
      console.log(`\n[${i + 1}/${pending.length}] 글 작성 진행: "${item.title}"`);
      const fileName = await generateAndSavePost(item, 'Tier 2: 경기24 공공데이터');
      if (fileName) {
        published.push(fileName);
        existingSourceIds.add(generateSourceId(item.title));
        await sleep(2500);
      }
    } catch (err) {
      console.error(`  ❌ "${item.title}" 생성 실패:`, err.message);
      if (err.code === 'QUOTA_EXHAUSTED' || isAllQuotaExhausted()) break;
    }
  }

  return { attempted: pending.length, published };
}

// ── [Tier 3] 의정부 평생학습 실시간 강좌(learning-courses.json) 자동 포스팅 ───
const LEARNING_COURSES_PATH = path.join(process.cwd(), 'src/data/learning-courses.json');

/**
 * 평생학습 강좌 질적 선별 필터 (CQF 헌법 준수)
 * - 커리큘럼(intro) 100자 이상 완비된 강좌만 선별
 * - 자잘한 사설 공예/소품 만들기(곱창밴드, 키친크로스 등) 및 단순 회차 배제
 * - 단순 분반(A반, B반) 및 온라인 신청 폼(수어노래방 등) 배제
 */
function isQualityCivicCourse(course) {
  if (!course || !course.title) return false;

  // 1. 상세 교육계획서(intro)가 최소 MIN_SOURCE_CHARS자 이상 충실하게 작성된 강좌만 허용
  if (!isSourceSufficient(course)) {
    const cleanLen = getCleanSourceText(course).length;
    console.log(`  [분량 미달 제외] "${course.title}" (원천 글자수: ${cleanLen}자 < ${MIN_SOURCE_CHARS}자)`);
    return false;
  }

  // 2. 자잘한 일일 취미 소품 만들기 및 단순 신청폼 배제
  const lowQualityKeywords = [
    '곱창밴드', '손바느질', '키친크로스', '도시락보자기', '패브릭 포스터',
    '가방만들기', '종이접기', '수어노래방', '우쿨렐레'
  ];
  if (lowQualityKeywords.some(kw => course.title.includes(kw))) return false;

  // 3. 단순 요일/분반 쪼개기 강좌 배제
  if (/-[A-Z]반|\b[0-9]반\b|화목반|월수반|금요반|토요반/.test(course.title)) return false;

  // 4. 신청 마감일 필터 (종료일이 오늘(KST)보다 이전이면 제외, 파싱 실패 시 제외 및 로그)
  const applyPeriod = course.applyPeriod;
  if (!applyPeriod || typeof applyPeriod !== 'string') {
    console.warn(`  [마감 필터 제외] "${course.title}" 신청기간 데이터 없음: "${applyPeriod}"`);
    return false;
  }
  const parts = applyPeriod.split('~');
  if (parts.length < 2) {
    console.warn(`  [마감 필터 제외] "${course.title}" 신청기간 구분자(~) 없음: "${applyPeriod}"`);
    return false;
  }
  const endStr = parts[1].trim();
  const match = endStr.match(/^(\d{2})\.(\d{2})\.(\d{2})$/);
  if (!match) {
    console.warn(`  [마감 필터 제외] "${course.title}" 종료일 형식 불일치 ("${endStr}"): "${applyPeriod}"`);
    return false;
  }
  const endFormatted = `20${match[1]}-${match[2]}-${match[3]}`;
  const today = getKSTDateString();
  if (endFormatted < today) {
    return false;
  }

  return true;
}

async function runTier3LifelongLearning(limit = MAX_POSTS_PER_RUN) {
  if (limit <= 0) return { attempted: 0, published: [] };
  console.log('\n[Tier 3] 의정부 평생학습 실시간 강좌 미발행 항목 검색 중...');
  if (!fs.existsSync(LEARNING_COURSES_PATH)) {
    console.log('  -> learning-courses.json 파일이 없어 자동 수집을 실행합니다...');
    try {
      const { execSync } = require('child_process');
      execSync('node scripts/build-learning-cache.js', { stdio: 'inherit' });
    } catch (e) {
      console.error('  ❌ 강좌 캐시 수집 실패:', e.message);
      return { attempted: 0, published: [] };
    }
  }

  const existingSourceIds = getExistingSourceIds();

  const learningData = JSON.parse(fs.readFileSync(LEARNING_COURSES_PATH, 'utf8'));
  const courses = learningData.courses || [];

  const pending = courses.filter(item => {
    if (!item.title) return false;
    const sourceId = item.id || generateSourceId(item.title);
    if (existingSourceIds.has(sourceId)) return false;
    return isQualityCivicCourse(item);
  }).slice(0, limit);

  if (pending.length === 0) {
    console.log('  -> 평생학습 강좌 중 선별 기준을 통과한 미발행 신규 항목이 없습니다.');
    return { attempted: 0, published: [] };
  }

  console.log(`  -> 선별 기준을 통과한 알짜 강좌 ${pending.length}건 배정 (최대 ${limit}건). 생성 시작...`);

  const published = [];
  for (let i = 0; i < pending.length; i++) {
    if (published.length >= limit) break;
    if (totalContentCalls >= MAX_CONTENT_CALLS_PER_RUN) break;
    if (isAllQuotaExhausted()) break;
    const course = pending[i];
    const feeText = course.isFree ? '무료' : (course.fee ? `${course.fee}` : '유료 (강의계획서 참조)');
    const postItem = {
      title: course.title,
      content: `교육기관: ${course.org}, 교육장소: ${course.address} (${course.dong}), 교육기간: ${course.eduPeriod}, 신청기간: ${course.applyPeriod}, 모집정원: ${course.capacity}, 수강료: ${feeText}, 주요대상: ${course.target}, 분야: ${course.category}. 상세 교육내용 및 강의계획: ${course.intro}. 의정부시 평생학습 통합플랫폼 뉴런 공식 온라인 접수.`,
      link: course.applyUrl || 'https://sugang.ull.or.kr',
      sourceId: course.id,
      expiresAt: extractExpiryDate(course.applyPeriod),
      category: '교육·청소년',
      department: course.org
    };

    try {
      console.log(`\n[${i + 1}/${pending.length}] 평생학습 글 작성 진행: "${course.title}"`);
      const fileName = await generateAndSavePost(postItem, 'Tier 3: 의정부 평생학습 실시간 강좌');
      if (fileName) {
        published.push(fileName);
        existingSourceIds.add(course.id);
        await sleep(2500);
      }
    } catch (err) {
      console.error(`  ❌ "${course.title}" 생성 실패:`, err.message);
      if (err.code === 'QUOTA_EXHAUSTED' || isAllQuotaExhausted()) break;
    }
  }

  return { attempted: pending.length, published };
}

// ── [메인 실행 엔진] ───────────────────────────────────────────────
async function main() {
  console.log('======================================================');
  console.log(`🚀 [의정부 포털] 오토 포스팅 엔진 시작 (안전 콤팩트 모드: 최대 ${MAX_POSTS_PER_RUN}건/회)`);
  console.log('실행 시각:', new Date().toISOString());
  console.log('======================================================');

  try {
    let remaining = MAX_POSTS_PER_RUN;

    // 1순위: 의정부시청 공식 RSS 피드
    const tier1 = await runTier1CityRss(remaining);
    remaining -= (tier1.published?.length || 0);

    // 2순위: 경기24 공공데이터
    const tier2 = await runTier2LocalInfo(remaining);
    remaining -= (tier2.published?.length || 0);

    // 3순위: 의정부 평생학습 실시간 강좌
    const tier3 = await runTier3LifelongLearning(remaining);

    const allPublishedFiles = new Set([
      ...(tier1.published || []),
      ...(tier2.published || []),
      ...(tier3.published || [])
    ]);

    const totalAttempted = (tier1.attempted || 0) + (tier2.attempted || 0) + (tier3.attempted || 0);
    const totalPublished = allPublishedFiles.size;
    const totalFailed = totalAttempted - totalPublished;

    console.log('\n======================================================');
    console.log(`📊 [발행 집계] 총 대상: ${totalAttempted}건 | 성공: ${totalPublished}건 | 실패: ${totalFailed}건`);
    console.log('======================================================');

    if (totalAttempted > 0 && totalPublished === 0) {
      if (isAllQuotaExhausted()) {
        console.warn('\nℹ️ [할당량 소진] 모든 Gemini 모델의 당일 사용 한도(PerDay Quota)가 소진되었습니다. 다음 슬롯에서 자동 재시도됩니다. (발행 0건, 정상 종료 exit 0)');
        process.exit(0);
        return;
      }
      console.warn(`\nℹ️ [원천 검증 미통과/발행 0건] 대상 ${totalAttempted}건 중 유효 통과 건수가 없어 0건으로 정상 종료합니다 (exit 0).`);
      process.exit(0);
      return;
    }

    if (totalFailed > 0) {
      console.warn(`\n⚠️ [부분 실패] 총 ${totalAttempted}건 중 ${totalPublished}건 성공, ${totalFailed}건 실패.`);
    } else if (totalPublished > 0) {
      console.log(`\n🎉 [성공] 총 ${totalPublished}건의 신규 시정 가이드 자동 포스팅 무결 발행 완료!`);
    } else {
      console.log('\nℹ️ [알림] 현재 발행 대기 중인 새로운 이슈가 없습니다.');
    }
  } catch (error) {
    if (error.code === 'QUOTA_EXHAUSTED' || error.isPerDayQuota || isAllQuotaExhausted()) {
      console.warn('\nℹ️ [할당량 소진] 모든 Gemini 모델의 당일 사용 한도(PerDay Quota)가 소진되었습니다. 다음 슬롯에서 자동 재시도됩니다. (발행 0건, 정상 종료 exit 0)');
      process.exit(0);
      return;
    }
    console.error('\n❌ [치명적 오류] 오토 포스팅 엔진 실행 실패:', error.message);
    process.exit(1);
    return;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
  filterTier1Candidates,
  filterTier2Candidates,
  isQualityCivicCourse,
};
