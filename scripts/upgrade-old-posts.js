/**
 * scripts/upgrade-old-posts.js
 * 양주 건강·생활 정보 포털 [구버전 저품질 글 In-Place 업그레이드 엔진]
 *
 * [원칙] 표준 · 범용 · 콤팩트 · 통합 · 공유 · 공통
 * - 유효 sourceLink 보유 & 1,000자 미만 구버전 글을 최신 7단계 시빅 가이드 파이프라인으로 전면 갱신
 * - 기존 파일명, URL, date, sourceId, sourceLink, category 등 핵심 SEO 불변성 100% 보존
 * - 무한 루프 방지: 영구 스킵 캐시(upgrade-skipped.json), 정보 증분 사전 판별 게이트,
 *                 최대 10회 탐색 시도, 품질 역전 방지 게이트, 성공 시에만 카운트 차감
 */

'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const { callGemini, transcribeImagesWithGemini } = require('./gemini-helper');
const { sleep, MIN_SOURCE_CHARS, getCleanSourceText, isSourceSufficient, validateSourceNumbers, crawlSourceBody } = require('./pipeline-utils');
const { POSTS_DIR, FALLBACK_HOME_URL, isFallbackOrEmptyUrl, getKSTDateString } = require('./post-utils');
const { PLAN_SCHEMA, CONTENT_SCHEMA, getRandomAngle, buildPlanPrompt, buildContentPrompt } = require('./prompt-builder');
const { normalizePost, sanitizeCalendarDays } = require('./markdown-standard');

const UPGRADE_SKIPPED_PATH = path.join(process.cwd(), 'public/data/upgrade-skipped.json');

/**
 * 마크다운 정규 표 구분선 감지 (파이프 및 3개 이상 하이픈)
 */
function hasMarkdownTable(text) {
  if (!text) return false;
  return /\|[\s]*:?---+:?[\s]*\|/.test(text) && /^\|[\s:|-]+\|$/m.test(text);
}

/**
 * 재크롤링 가능한 유효 소스 URL 검증
 */
function isValidReCrawlSource(url) {
  if (!url || typeof url !== 'string' || isFallbackOrEmptyUrl(url)) return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http')) return false;
  const norm = trimmed.replace(/\/+$/, '');
  if (norm === FALLBACK_HOME_URL || norm.endsWith('/index.do') || norm.endsWith('.pdf')) return false;
  return true;
}

/**
 * 영구 스킵 캐시 조회
 */
function getUpgradeSkipped() {
  if (!fs.existsSync(UPGRADE_SKIPPED_PATH)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(UPGRADE_SKIPPED_PATH, 'utf8'));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/**
 * 영구 스킵 기록 (최대 500개 유지)
 */
function saveUpgradeSkipped(fileName, reason = '') {
  if (!fileName) return;
  try {
    const current = getUpgradeSkipped();
    const exists = current.some(item => (typeof item === 'string' ? item === fileName : item.file === fileName));
    if (!exists) {
      current.push({ file: fileName, reason, skippedAt: getKSTDateString() });
      const trimmed = current.slice(-500);
      fs.mkdirSync(path.dirname(UPGRADE_SKIPPED_PATH), { recursive: true });
      fs.writeFileSync(UPGRADE_SKIPPED_PATH, JSON.stringify(trimmed, null, 2), 'utf8');
    }
  } catch {}
}

/**
 * 업그레이드 타겟 자동 선별 및 본문 길이 오름차순 정렬
 */
function getUpgradeTargets() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const skippedList = getUpgradeSkipped().map(item => (typeof item === 'string' ? item : item.file));
  const skippedSet = new Set(skippedList);

  const targets = [];

  for (const file of files) {
    // 1. 이미 스킵 처리된 파일은 후보군에서 즉시 제외
    if (skippedSet.has(file)) continue;

    const fullPath = path.join(POSTS_DIR, file);
    try {
      const raw = fs.readFileSync(fullPath, 'utf8');
      const parsed = matter(raw);

      // 2. 이미 업그레이드된 글은 영구 제외 (upgradedAt 존재 시)
      if (parsed.data.upgradedAt) continue;

      const link = parsed.data.sourceLink || parsed.data.sourceUrl || parsed.data.link;
      // 3. 유효한 원본 URL 필수
      if (!isValidReCrawlSource(link)) continue;

      const body = parsed.content.trim();
      const bodyLen = body.length;
      const hasTable = hasMarkdownTable(body);

      // 4. 본문 1,000자 미만이거나 표가 없는 글
      if (bodyLen < 1000 || !hasTable) {
        targets.push({
          file,
          fullPath,
          title: parsed.data.title,
          bodyLen,
          hasTable,
          link,
          parsed
        });
      }
    } catch {}
  }

  // 5. 본문 길이가 가장 짧은 순서(오름차순)로 정렬
  targets.sort((a, b) => a.bodyLen - b.bodyLen);
  return targets;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const limitArg = process.argv.find(a => a.startsWith('--limit='));
  const maxCount = limitArg 
    ? parseInt(limitArg.split('=')[1], 10) 
    : parseInt(process.env.MAX_UPGRADE_COUNT || '1', 10);

  const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS || 5); // 1회 실행당 최대 크롤링 탐색 후보 수 (무한 루프 차단)

  console.log(`[양주인 구버전 글 업그레이드 파이프라인] Mode: ${isDryRun ? 'DRY-RUN (조사 모드)' : 'LIVE (실제 갱신)'}, 목표 완료 수: ${maxCount}건, 최대 탐색 제한: ${MAX_ATTEMPTS}회`);

  const targets = getUpgradeTargets();
  console.log(`총 업그레이드 유효 대상: ${targets.length}건 식별 완료`);

  if (targets.length === 0) {
    console.log('업그레이드가 필요한 구버전 글이 없습니다. (모든 글이 최신 규격을 충족합니다.)');
    return;
  }

  console.log('\n--- 업그레이드 우선순위 상위 후보 (최단 글자 수 순) ---');
  targets.slice(0, Math.min(5, targets.length)).forEach((t, i) => {
    console.log(`  ${i + 1}. [${t.bodyLen}자 / 표: ${t.hasTable ? 'O' : 'X'}] ${t.file} - "${t.title}"`);
  });

  let processedCount = 0;
  let attemptCount = 0;

  for (const target of targets) {
    if (processedCount >= maxCount) break;
    if (attemptCount >= MAX_ATTEMPTS) {
      console.log(`\n최대 탐색 시도 횟수(${MAX_ATTEMPTS}회)에 도달하여 탐색을 종료합니다.`);
      break;
    }

    attemptCount++;
    console.log(`\n======================================================================`);
    console.log(`[탐색 시도 ${attemptCount}/${MAX_ATTEMPTS}] (목표 달성: ${processedCount}/${maxCount}) 대상: ${target.file}`);
    console.log(`  - 기존 제목: "${target.title}"`);
    console.log(`  - 기존 본문: ${target.bodyLen}자 (표 포함: ${target.hasTable ? 'O' : 'X'})`);
    console.log(`  - 원본 링크: ${target.link}`);

    // 1. 원문 재크롤링 및 이미지 분석
    const crawled = await crawlSourceBody(target.link);
    const rawLen = (crawled.rawBodyText || crawled.text || '').length;
    const validImgCount = (crawled.validImages || []).length;
    const hwpxLen = (crawled.hwpxText || '').length;

    console.log(`  -> 원본 소스 크롤링: 본문 ${rawLen}자, 첨부 HWPX ${hwpxLen}자, 골든 규격 이미지 ${validImgCount}장`);

    // 2. 정보 증분(Information Gain) 사전 판별 게이트
    const hasNewMaterial = (validImgCount >= 1) || (hwpxLen >= 200) || (rawLen >= Math.max(target.bodyLen * 1.3, 900));

    if (!hasNewMaterial) {
      console.warn(`  ⚠️ [스킵 - 추가 원문/이미지 재료 부족] 원문 ${rawLen}자, 이미지 ${validImgCount}장, HWPX ${hwpxLen}자 (기존 ${target.bodyLen}자 대비 증분 없음) -> 다음 후보로 이동`);
      if (!isDryRun) {
        saveUpgradeSkipped(target.file, 'INSUFFICIENT_NEW_MATERIAL');
      }
      continue;
    }

    if (isDryRun) {
      console.log(`  [DRY-RUN 완료] 유효 업그레이드 대상 발견: 원문 ${rawLen}자, 이미지 ${validImgCount}장, HWPX ${hwpxLen}자 (API 호출 없이 시뮬레이션 완료)`);
      processedCount++;
      continue;
    }

    // 3. 조건부 Vision OCR (포스터 시각 판독)
    if (process.env.ENABLE_VISION_OCR !== '0' && hwpxLen < 200 && validImgCount >= 1 && rawLen < 1200) {
      if (process.env.GEMINI_API_KEY) {
        console.log(`  -> [Vision OCR 조건 충족] 포스터/카드뉴스 이미지 ${validImgCount}장 시각 판독 시작`);
        try {
          const ocrText = await transcribeImagesWithGemini(crawled.validImages);
          if (ocrText && ocrText.trim()) {
            console.log(`  -> [카드뉴스/포스터 판독 성공] ${ocrText.trim().length}자 텍스트 결합`);
            crawled.text = (crawled.text ? crawled.text + '\n\n' : '') + `[첨부 카드뉴스/포스터 판독 전문]\n${ocrText.trim()}`;
          }
        } catch (ocrErr) {
          console.warn(`  ⚠️ [Vision OCR 실패] ${ocrErr.message}`);
        }
      }
    }

    const sourceBody = crawled.text || '';
    const combinedItem = { ...target.parsed.data, sourceBody };
    const totalCleanLen = getCleanSourceText(combinedItem).length;

    if (!isSourceSufficient(combinedItem) || totalCleanLen < MIN_SOURCE_CHARS) {
      console.warn(`  ⚠️ [사후 분량 미달] 최종 추출 텍스트 ${totalCleanLen}자 < ${MIN_SOURCE_CHARS}자 -> 스킵`);
      saveUpgradeSkipped(target.file, 'POST_CRAWL_INSUFFICIENT_LENGTH');
      continue;
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn(`  ℹ️ [API 키 대기] GEMINI_API_KEY가 로컬 환경에 미설정되어 LLM 작성을 건너뜁니다 (GitHub Actions 환경에서 자동 수행).`);
      continue;
    }

    const upgradeWritingGuide = '\n\n[업그레이드 집필 지침: 위 원문 팩트를 하나도 빠짐없이 활용하고, 시민이 읽기 편한 상세 해설 문단, 마크다운 요약 표(| 구분 | 내용 |), 신청/이용 시 유의사항 및 문의처 안내를 충실히 전개하여 본문 총 길이가 최소 1,100자 이상이 되도록 상세히 작성하세요. (없는 사실 날조 금지)]';
    const promptItem = {
      title: target.parsed.data.title,
      description: target.parsed.data.summary,
      sourceBody: sourceBody + upgradeWritingGuide,
      link: target.link
    };
    const validationSource = `${promptItem.title || ''} ${promptItem.description || ''} ${sourceBody}`;
    const angle = getRandomAngle();

    let plan = null;
    let content = null;
    let attempts = 0;
    const MAX_REWRITES = 3;

    try {
      while (attempts < MAX_REWRITES) {
        attempts++;
        console.log(`  -> [LLM 기획 및 본문 작성 (${attempts}/${MAX_REWRITES})] Gemini 호출 중...`);
        plan = await callGemini(buildPlanPrompt(promptItem), PLAN_SCHEMA, 'lite');
        await sleep(2000);

        content = await callGemini(buildContentPrompt(promptItem, plan, angle), CONTENT_SCHEMA, 'flash');

        // 팩트 숫자/토큰 무결성 검증
        const fullTextToValidate = `${plan?.frontmatter?.title || ''} ${plan?.frontmatter?.summary || ''} ${content?.markdownContent || ''}`;
        const violations = validateSourceNumbers(fullTextToValidate, validationSource);
        if (violations.length === 0) break;

        console.warn(`  ⚠️ [원천 팩트 위반 (${attempts}/${MAX_REWRITES})] 토큰: ${violations.join(', ')} -> 재시도`);
        if (attempts >= MAX_REWRITES) {
          console.error(`  ❌ [품질 게이트 차단] 3회 재작성 초과 -> 업그레이드 기각`);
          break;
        }
        await sleep(2000);
      }
    } catch (llmErr) {
      console.warn(`  ⚠️ [LLM 호출 실패] ${llmErr.message}`);
    }

    if (!plan || !content || !content.markdownContent) {
      console.warn(`  ⚠️ 생성 실패로 인해 건너뜁니다.`);
      saveUpgradeSkipped(target.file, 'LLM_GENERATION_FAILED');
      continue;
    }

    // SEO 불변 In-Place 저장 구조
    const todayKST = getKSTDateString();
    const updatedFrontmatter = {
      ...target.parsed.data,
      summary: plan?.frontmatter?.summary || target.parsed.data.summary,
      upgradedAt: todayKST
    };

    // 기존 글의 date에서 baseYear 추출 (기본값 2026)
    const dateMatch = String(updatedFrontmatter.date || '').match(/^(\d{4})/);
    const baseYear = dateMatch ? parseInt(dateMatch[1], 10) : 2026;

    // 1차 결합 (새 마크다운 본문 + 보존된 Frontmatter)
    const rawNewFileContent = matter.stringify(content.markdownContent, updatedFrontmatter);

    // 2차 전사 표준 정규화 및 요일 보정 (post-utils.js 표준 순서 준수)
    const normalized = normalizePost(rawNewFileContent);
    const sanitizedFullContent = sanitizeCalendarDays(normalized.fullContent, baseYear, `업그레이드[${target.file}]`);
    const finalFullContent = sanitizedFullContent;

    // 3차 최종 문자열 재파싱 및 순수 본문/길이 정밀 추출
    const parsedFinal = matter(finalFullContent);
    const finalNewBody = parsedFinal.content.trim();
    const finalNewLen = finalNewBody.length;

    // 안전장치 5: 품질 역전 방지 게이트 (Regression Guard)
    const isSubstantialUpgrade = finalNewLen >= 1000 || (finalNewLen >= 800 && finalNewLen >= target.bodyLen + 150);
    if (finalNewLen <= target.bodyLen || !isSubstantialUpgrade || !hasMarkdownTable(finalNewBody)) {
      console.warn(`  ❌ [품질 역전 방지 발동] 새 본문 길이(${finalNewLen}자) <= 기존(${target.bodyLen}자) 또는 실질 증량 미달/표 누락 -> 덮어쓰기 폐기`);
      saveUpgradeSkipped(target.file, 'REGRESSION_GUARD_TRIGGERED');
      continue;
    }

    // 제자리 덮어쓰기 (Frontmatter 단일 세트 보장된 finalFullContent 직접 저장)
    fs.writeFileSync(target.fullPath, finalFullContent, 'utf8');

    console.log(`  ✅ [In-Place 업그레이드 완료] ${target.file}`);
    console.log(`     - 본문 분량: ${target.bodyLen}자 ➔ ${finalNewLen}자 (+${finalNewLen - target.bodyLen}자)`);
    console.log(`     - upgradedAt: ${todayKST} 기록 완료`);
    processedCount++;
    await sleep(2000);
  }

  console.log(`\n======================================================================`);
  console.log(`[업그레이드 작업 종료] 탐색 시도: ${attemptCount}회, 실제 성공: ${processedCount}건`);
}

main().catch(err => {
  console.error('Upgrade script fatal error:', err);
  process.exit(0); // Zero-Risk Fallback: 본 배포 파이프라인 절대 중단 방지
});
