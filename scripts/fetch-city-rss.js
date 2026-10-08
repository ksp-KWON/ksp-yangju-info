/**
 * scripts/fetch-city-rss.js
 * 양주시청 공식 RSS 통합 수집 및 정제 엔진
 * 
 * 헌법 준수 (.agents/AGENTS.md)
 * - 양주시 공식 블로그 RSS 피드 실시간 수집
 * - 기한 만료 및 과거 정보 결정적 자동 배제
 * - 저품질 단순 공고 및 행정 내부잡무 배제
 * - 중복 공고 교차 방지 및 발행 대기열(city-rss.json) 관리
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  safeFetch,
  sleep,
} = require('./pipeline-utils');
const {
  isDuplicatePost,
  generateSourceId,
  getExistingSourceIds,
  getExistingSourceLinks,
  isFallbackOrEmptyUrl,
} = require('./post-utils');

const CITY_RSS_FILE = path.join(process.cwd(), 'public/data/city-rss.json');

// 양주시 공식 RSS 피드 설정
const RSS_CONFIGS = [
  {
    name: '양주시공식블로그',
    url: 'https://rss.blog.naver.com/yangju619.xml',
    category: '시정소식',
  },
];

/**
 * 기한 만료 여부 판별 (현재 시점 기준 지난 공고인지 엄격 판정)
 */
function isItemExpired(title, description) {
  const text = `${title} ${description}`;
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const currentYear = kstNow.getFullYear();
  const currentMonth = kstNow.getMonth() + 1;
  const currentDay = kstNow.getDate();

  // '202X년 X월 X일' 또는 '202X. X. X.' 또는 'X.X.(요일)' 패턴 추출
  const dateRangeMatches = [...text.matchAll(/(?:(\d{4})[.\-/년]\s*)?(\d{1,2})[.\-/월]\s*(\d{1,2})일?(?:\s*\([월화수목금토일]\))?\s*(?:~|∼|-|부터)\s*(?:(\d{4})[.\-/년]\s*)?(\d{1,2})[.\-/월]\s*(\d{1,2})일?/g)];
  
  for (const m of dateRangeMatches) {
    const endYear = m[4] ? parseInt(m[4], 10) : (m[1] ? parseInt(m[1], 10) : currentYear);
    const endMonth = parseInt(m[5], 10);
    const endDay = parseInt(m[6], 10);

    if (endMonth >= 1 && endMonth <= 12 && endDay >= 1 && endDay <= 31) {
      if (endYear < currentYear) return true;
      if (endYear === currentYear) {
        if (endMonth < currentMonth) return true;
        if (endMonth === currentMonth && endDay < currentDay) return true;
      }
    }
  }

  // 단일 마감일 'X월 X일(X)까지' 패턴
  const singleDeadlineMatches = [...text.matchAll(/(?:(\d{4})[.\-/년]\s*)?(\d{1,2})[.\-/월]\s*(\d{1,2})일?(?:\s*\([월화수목금토일]\))?\s*(?:까지|마감|限)/g)];
  for (const m of singleDeadlineMatches) {
    const year = m[1] ? parseInt(m[1], 10) : currentYear;
    const month = parseInt(m[2], 10);
    const day = parseInt(m[3], 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      if (year < currentYear) return true;
      if (year === currentYear) {
        if (month < currentMonth) return true;
        if (month === currentMonth && day < currentDay) return true;
      }
    }
  }

  // 과거 연도 행사 명시 배제 (작년 이전)
  if (title.includes('2025년') || title.includes('2024년') || title.includes('2023년')) {
    return true;
  }

  return false;
}

/**
 * 시민 생활과 무관한 저품질 공고/행정 내부잡무 배제
 */
function isLowQualityNotice(title, description) {
  const text = `${title} ${description}`;
  const lowQualityKeywords = [
    '수의계약 내역공개', '공시송달', '분묘개장공고', '입찰공고', '개찰결과',
    '공사(', '용역(', '물품(', '재난관리기금', '장비임차', '매각 일반입찰', '공유재산',
    '주요업무계획', '행정서비스 헌장', '공표', '군 훈련', '대대전술훈련', '합공방공훈련',
    '사격훈련', '성인지 교육', '발대식', '환경정비', '다과세트 전달', '흙공 만들기', '정담회',
    '추천도서', '종이접기', '안전점검의 날', '주간농사정보', '농사정보'
  ];
  return lowQualityKeywords.some(kw => text.includes(kw));
}

/**
 * 초경량 XML 아이템 파서 (기한 만료 및 저품질 자동 배제 & 스마트 카테고리 분류)
 */
function parseRssXml(xmlText, defaultCategory, feedName) {
  const items = [];
  const itemMatches = [...xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

  for (const match of itemMatches) {
    const itemBlock = match[1];

    const titleMatch = itemBlock.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) || itemBlock.match(/<title>(.*?)<\/title>/i);
    const linkMatch = itemBlock.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/i) || itemBlock.match(/<link>(.*?)<\/link>/i);
    const descMatch = itemBlock.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || itemBlock.match(/<description>([\s\S]*?)<\/description>/i);
    const dateMatch = itemBlock.match(/<pubDate><!\[CDATA\[(.*?)\]\]><\/pubDate>/i) || itemBlock.match(/<pubDate>(.*?)<\/pubDate>/i);

    const title = titleMatch ? titleMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim() : '';
    const link = linkMatch ? linkMatch[1].trim() : '';
    let description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const pubDate = dateMatch ? dateMatch[1].trim() : '';

    if (!title || title === feedName || title.includes('RSS서비스')) {
      continue;
    }

    // ── 기한 만료 및 과거 정보 자동 배제 ──
    if (isItemExpired(title, description)) {
      continue;
    }

    // ── 저품질 단순 공고 및 행정 내부잡무 배제 ──
    if (isLowQualityNotice(title, description)) {
      continue;
    }

    // 카테고리 스마트 세분화 (키워드 기반 교차 보정)
    let finalCategory = defaultCategory;
    if (title.includes('병원') || title.includes('약국') || title.includes('의료') || title.includes('검진') || title.includes('보건')) {
      finalCategory = '병원·약국';
    } else if (title.includes('축제') || title.includes('공연') || title.includes('행사') || title.includes('페스타') || title.includes('문화') || title.includes('나리농원') || title.includes('회암사지')) {
      finalCategory = '축제·나들이';
    } else if (title.includes('지원금') || title.includes('복지') || title.includes('수당') || title.includes('바우처') || title.includes('감면') || title.includes('장학')) {
      finalCategory = '복지·지원금';
    } else if (title.includes('일자리') || title.includes('채용') || title.includes('취업') || title.includes('소상공인') || title.includes('창업')) {
      finalCategory = '일자리·소상공인';
    } else if (title.includes('교육') || title.includes('강좌') || title.includes('수강') || title.includes('아카데미')) {
      finalCategory = '교육·청소년';
    }

    items.push({
      title,
      link,
      description,
      pubDate,
      category: finalCategory,
      feedName,
      sourceId: generateSourceId(title),
    });
  }

  return items;
}

async function main() {
  console.log('======================================================');
  console.log('📡 [양주인 포털] 양주시 공식 RSS 통합 수집 파이프라인');
  console.log('실행 시각:', new Date().toISOString());
  console.log('======================================================\n');

  const existingSourceIds = getExistingSourceIds();
  const existingSourceLinks = getExistingSourceLinks();
  console.log(`기발행 게시글: ID ${existingSourceIds.size}개, Link ${existingSourceLinks.size}개 확인됨.`);

  // 기존 city-rss.json이 있으면 로드
  let existingRssQueue = [];
  if (fs.existsSync(CITY_RSS_FILE)) {
    try {
      existingRssQueue = JSON.parse(fs.readFileSync(CITY_RSS_FILE, 'utf8'));
    } catch {
      existingRssQueue = [];
    }
  }

  const seenSet = new Set([...existingSourceIds, ...existingSourceLinks]);
  existingRssQueue.forEach(item => {
    if (item.sourceId) seenSet.add(item.sourceId);
    if (item.link && !isFallbackOrEmptyUrl(item.link)) seenSet.add(item.link.trim());
  });

  const allCollectedItems = [];
  let newCollectedCount = 0;

  for (const config of RSS_CONFIGS) {
    try {
      console.log(`\n[수집 중] ${config.name} RSS (${config.category}) -> ${config.url}`);
      const res = await safeFetch(config.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*;q=0.8',
        }
      }, 10000);
      if (!res.ok) {
        console.warn(`  ⚠️ HTTP 오류: ${res.status}`);
        continue;
      }

      const xmlText = await res.text();
      const parsedItems = parseRssXml(xmlText, config.category, config.name);
      console.log(`  -> 원본 ${parsedItems.length}개 아이템 파싱 완료.`);

      for (const item of parsedItems) {
        if (!isDuplicatePost(item, seenSet)) {
          if (item.sourceId) seenSet.add(item.sourceId);
          if (item.link && !isFallbackOrEmptyUrl(item.link)) seenSet.add(item.link.trim());
          allCollectedItems.push(item);
          newCollectedCount++;
        }
      }
    } catch (err) {
      console.error(`  ❌ ${config.name} 수집 실패:`, err.message);
    }
    await sleep(500);
  }

  // 큐 병합 및 만료 데이터 전면 정화 (신규 수집 항목 + 기존 미발행 항목 중 유효한 것만 유지)
  const mergedQueue = [...allCollectedItems, ...existingRssQueue];
  const finalQueue = [];
  const recordedSet = new Set([...existingSourceIds, ...existingSourceLinks]);

  for (const item of mergedQueue) {
    if (!item || isDuplicatePost(item, recordedSet)) continue;
    if (isItemExpired(item.title, item.description)) continue;
    if (isLowQualityNotice(item.title, item.description)) continue;
    if (item.sourceId) recordedSet.add(item.sourceId);
    if (item.link && !isFallbackOrEmptyUrl(item.link)) recordedSet.add(item.link.trim());
    finalQueue.push(item);
  }

  // 저장 디렉토리 보장 및 저장
  const dir = path.dirname(CITY_RSS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(CITY_RSS_FILE, JSON.stringify(finalQueue, null, 2), 'utf8');

  console.log('\n======================================================');
  console.log(`✅ [수집 완료] 신규 아이템: ${newCollectedCount}개`);
  console.log(`📦 [발행 대기 큐 총량 (만료 항목 전면 배제)]: ${finalQueue.length}개 (파일: public/data/city-rss.json)`);
  console.log('======================================================');
  return finalQueue;
}

if (require.main === module) {
  main().catch(err => {
    console.error('치명적 에러:', err);
    process.exit(1);
  });
}

module.exports = {
  RSS_CONFIGS,
  parseRssXml,
  isItemExpired,
  isLowQualityNotice,
  main,
};
