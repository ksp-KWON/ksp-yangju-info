/**
 * scripts/fetch-city-rss.js
 * 양주시 공식 RSS 공통 통합 수집 엔진
 * 
 * 헌법 제3조 3.1항 [표준 · 범용 · 콤팩트 · 통합 · 공유 · 공통] 준수
 * 외부 의존성 없이 Node.js 표준 fetch와 정규식으로 피드 일괄 파싱 및 중복 필터링
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { generateSourceId, getExistingSourceIds, getExistingSourceLinks, isDuplicatePost, isFallbackOrEmptyUrl } = require('./post-utils');
const { safeFetch, sleep, decodeHtmlEntities } = require('./pipeline-utils');

const CITY_RSS_FILE = path.join(process.cwd(), 'public/data/city-rss.json');

// ── 양주시 공식 블로그 RSS 피드 및 카테고리 매핑 설정 ──
const RSS_CONFIGS = [
  {
    id: 'naver-blog',
    name: '양주시공식블로그',
    url: 'https://rss.blog.naver.com/yangju619.xml',
    category: '일자리·생활',
  },
];

/**
 * 기한 만료 및 과거 연도 정보 자동 배제 필터 (2026년 기준)
 */
function isItemExpired(title, description) {
  const fullText = title + ' ' + (description || '');

  // 1) 2025년 이전 과거 연도 단독 포함 시 배제
  const oldYearMatch = fullText.match(/\b(201[0-9]|202[0-5])\b/);
  if (oldYearMatch && !fullText.includes('2026')) {
    return true;
  }

  // 2) KST 오늘 자정 기준 만료일 검사
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayThreshold = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate(), 0, 0, 0));

  const regex = /(?:20)?(2[0-9])\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/g;
  const dates = [];
  let m;
  while ((m = regex.exec(fullText)) !== null) {
    const year = 2000 + parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const day = parseInt(m[3], 10);
    dates.push(new Date(Date.UTC(year, month, day, 23, 59, 59)));
  }

  if (dates.length > 0) {
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    if (maxDate < todayThreshold) {
      return true; // 기한 만료
    }
  }

  return false;
}

/**
 * 저품질 단순 공고 및 시민 생활 무관 행정 내부잡무 배제 필터
 */
function isLowQualityNotice(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  const lowQualityKeywords = [
    '입찰', '견적제출', '소액수의', '청소용역', '관급자재', '폐기물', '단가계약', '취소공고',
    '공사(', '용역(', '물품(', '재난관리기금', '장비임차', '매각 일반입찰', '공유재산',
    '주요업무계획', '행정서비스 헌장', '공표', '군 훈련', '대대전술훈련', '합공방공훈련',
    '사격훈련', '성인지 교육', '발대식', '환경정비', '다과세트 전달', '흙공 만들기', '원외재판부 유치', '정담회',
    '추천도서', '종이접기', '안전점검의 날', '주간농사정보', '농사정보'
  ];
  return lowQualityKeywords.some(kw => text.includes(kw));
}

/**
 * 초경량 XML 아이템 파서
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
    const catMatch = itemBlock.match(/<category><!\[CDATA\[(.*?)\]\]><\/category>/i) || itemBlock.match(/<category>(.*?)<\/category>/i);

    const rawTitle = titleMatch ? titleMatch[1].trim() : '';
    const title = decodeHtmlEntities(rawTitle);
    const link = linkMatch ? linkMatch[1].trim() : '';
    const rawDesc = descMatch ? descMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
    let description = decodeHtmlEntities(rawDesc);
    const pubDate = dateMatch ? dateMatch[1].trim() : '';
    const rawCategory = catMatch ? catMatch[1].trim() : '';

    if (!title || !link || title === feedName || title.includes('RSS서비스')) {
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

    // 카테고리 스마트 세분화 (전사 9대 표준 카테고리 직접 매핑)
    let finalCategory = defaultCategory;
    if (rawCategory.includes('복지') || title.includes('지원금') || title.includes('복지') || title.includes('수당') || title.includes('바우처') || title.includes('감면') || title.includes('병원') || title.includes('약국') || title.includes('의료') || title.includes('검진') || title.includes('보건') || title.includes('돌봄') || title.includes('노인') || title.includes('장애인')) {
      finalCategory = '복지·돌봄';
    } else if (rawCategory.includes('문화') || title.includes('축제') || title.includes('공연') || title.includes('행사') || title.includes('전시') || title.includes('페스타') || title.includes('예술') || title.includes('음악')) {
      finalCategory = '문화·예술';
    } else if (title.includes('체육') || title.includes('공원') || title.includes('산책') || title.includes('나들이') || title.includes('등산') || title.includes('운동')) {
      finalCategory = '체육·공원';
    } else if (title.includes('교통') || title.includes('주차') || title.includes('버스') || title.includes('도로') || title.includes('전철') || title.includes('철도')) {
      finalCategory = '교통·주차';
    } else if (title.includes('일자리') || title.includes('채용') || title.includes('취업') || title.includes('소상공인') || title.includes('창업')) {
      finalCategory = '일자리·생활';
    } else if (title.includes('청소') || title.includes('환경') || title.includes('폐기물') || title.includes('쓰레기') || title.includes('재활용')) {
      finalCategory = '청소·환경';
    } else if (title.includes('재난') || title.includes('민방위') || title.includes('안전') || title.includes('훈련') || title.includes('대피')) {
      finalCategory = '재난·민방위';
    } else if (title.includes('주택') || title.includes('재개발') || title.includes('건축') || title.includes('아파트')) {
      finalCategory = '주택·재개발';
    } else if (title.includes('기업') || title.includes('농업') || title.includes('농사') || title.includes('경제')) {
      finalCategory = '기업경제·농업';
    }

    items.push({
      title,
      link,
      description: description.slice(0, 300),
      pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      category: finalCategory,
      feedName,
      sourceId: generateSourceId(title),
      collectedAt: new Date().toISOString()
    });
  }

  return items;
}

async function main() {
  console.log('======================================================');
  console.log('📡 [양주인 포털] 공식 블로그 RSS 통합 수집 파이프라인');
  console.log('실행 시각:', new Date().toISOString());
  console.log('======================================================\n');

  const existingSourceIds = getExistingSourceIds();
  const existingSourceLinks = getExistingSourceLinks();
  console.log(`기발행 게시글: ID ${existingSourceIds.size}개, Link ${existingSourceLinks.size}개 확인됨.`);

  // 기존 city-rss.json 로드
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
      }, 15000);
      if (!res.ok) {
        console.warn(`  ⚠️ HTTP 오류: ${res.status}`);
        continue;
      }

      const xmlText = await res.text();
      const parsedItems = parseRssXml(xmlText, config.category, config.name);
      console.log(`  -> 원본 ${parsedItems.length}개 유효 아이템 추출 완료.`);

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

  // 큐 병합 및 만료/저품질 데이터 전면 정화
  const mergedQueue = [...allCollectedItems, ...existingRssQueue];
  const finalQueue = [];
  const recordedSet = new Set([...existingSourceIds, ...existingSourceLinks]);

  for (const item of mergedQueue) {
    if (!item || isDuplicatePost(item, recordedSet)) continue;
    if (isItemExpired(item.title, item.description)) continue;
    if (isLowQualityNotice(item.title, item.description)) continue;
    if (item.sourceId) recordedSet.add(item.sourceId);
    if (item.link && !isFallbackOrEmptyUrl(item.link)) recordedSet.add(item.link.trim());

    // 9대 표준 카테고리 정합 보장
    if (item.category === '복지·지원금' || item.category === '건강·의료') item.category = '복지·돌봄';
    if (item.category === '생활·민원' || item.category === '행정소식') item.category = '일자리·생활';

    finalQueue.push(item);
  }

  const dir = path.dirname(CITY_RSS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(CITY_RSS_FILE, JSON.stringify(finalQueue, null, 2), 'utf8');

  console.log('\n======================================================');
  console.log(`✅ [수집 완료] 신규 아이템: ${newCollectedCount}개`);
  console.log(`📦 [발행 대기 큐 총량 (만료·저품질 전면 배제)]: ${finalQueue.length}개 (파일: public/data/city-rss.json)`);
  console.log('======================================================');
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
  isLowQualityNotice
};
