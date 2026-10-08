/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * scripts/fetch-city-rss.js
 * 양주시 공식 블로그 RSS 통합 수집 엔진 (ksp-yangju-info)
 * 
 * 헌법 제1편 [E-E-A-T 신뢰도] 및 제3조 [공통·표준] 준수
 * - 기한 만료 공고(과거 연도/만료일) 자동 배제 엔진 탑재
 * - 단순 행정 내부잡무/입찰 등 저품질 공고 자동 배제 엔진 탑재
 * - 정밀 중복 방지 (sourceId 및 원본 링크 동시 검증)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { generateSourceId, getExistingSourceIds, getExistingSourceLinks, isDuplicatePost, isFallbackOrEmptyUrl } = require('./post-utils');
const { safeFetch } = require('./pipeline-utils');

const CITY_RSS_FILE = path.join(process.cwd(), 'public/data/city-rss.json');
const YANGJU_RSS_URL = 'https://rss.blog.naver.com/yangju619.xml';

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
 * 네이버 블로그 RSS XML을 파싱합니다.
 */
function parseRssXml(xmlText) {
  const items = [];
  const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || [];

  for (const itemBlock of itemMatches) {
    const titleMatch = itemBlock.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) || itemBlock.match(/<title>(.*?)<\/title>/i);
    const linkMatch = itemBlock.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/i) || itemBlock.match(/<link>(.*?)<\/link>/i);
    const descMatch = itemBlock.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || itemBlock.match(/<description>([\s\S]*?)<\/description>/i);
    const pubDateMatch = itemBlock.match(/<pubDate>(.*?)<\/pubDate>/i);
    const catMatch = itemBlock.match(/<category><!\[CDATA\[(.*?)\]\]><\/category>/i) || itemBlock.match(/<category>(.*?)<\/category>/i);

    const title = titleMatch ? titleMatch[1].trim() : '';
    const link = linkMatch ? linkMatch[1].trim() : '';
    let description = descMatch ? descMatch[1].trim() : '';
    const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : '';
    const rawCategory = catMatch ? catMatch[1].trim() : '생활·민원';

    if (!title || !link) continue;

    // 기한 만료 및 저품질 배제
    if (isItemExpired(title, description)) {
      console.log(`  [기한만료 제외] "${title}"`);
      continue;
    }
    if (isLowQualityNotice(title, description)) {
      console.log(`  [저품질행정 제외] "${title}"`);
      continue;
    }

    // description 내 이미지 태그 및 HTML 태그 텍스트화
    const textContent = description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    // 카테고리 매핑
    let category = '생활·민원';
    if (rawCategory.includes('복지') || title.includes('지원') || title.includes('급여') || title.includes('수당')) {
      category = '복지·지원금';
    } else if (rawCategory.includes('문화') || title.includes('축제') || title.includes('공연') || title.includes('전시')) {
      category = '문화·예술';
    } else if (title.includes('일자리') || title.includes('취업') || title.includes('채용') || title.includes('모집')) {
      category = '일자리·생활';
    } else if (title.includes('교통') || title.includes('주차') || title.includes('버스') || title.includes('도로')) {
      category = '교통·주차';
    } else if (title.includes('건강') || title.includes('의료') || title.includes('보건') || title.includes('병원')) {
      category = '건강·의료';
    }

    items.push({
      sourceId: generateSourceId(title),
      feedName: '양주시공식블로그',
      category,
      title,
      link,
      description: textContent.slice(0, 300),
      pubDate: pubDateStr ? new Date(pubDateStr).toISOString() : new Date().toISOString(),
      collectedAt: new Date().toISOString(),
    });
  }

  return items;
}

async function fetchYangjuRss() {
  console.log('📡 [양주인 포털] 양주시 공식 블로그 RSS 통합 수집 파이프라인 가동');

  let existingRssQueue = [];
  if (fs.existsSync(CITY_RSS_FILE)) {
    try {
      existingRssQueue = JSON.parse(fs.readFileSync(CITY_RSS_FILE, 'utf8'));
    } catch {
      existingRssQueue = [];
    }
  }

  const existingSourceIds = getExistingSourceIds();
  const existingSourceLinks = getExistingSourceLinks();
  const seenSet = new Set([...existingSourceIds, ...existingSourceLinks]);

  existingRssQueue.forEach(item => {
    if (item.sourceId) seenSet.add(item.sourceId);
    if (item.link && !isFallbackOrEmptyUrl(item.link)) seenSet.add(item.link.trim());
  });

  const allCollectedItems = [];

  try {
    console.log(`[수집 중] 양주시 공식 블로그 RSS -> ${YANGJU_RSS_URL}`);
    const res = await safeFetch(YANGJU_RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*;q=0.8',
      },
    }, 15000);

    if (!res.ok) {
      console.warn(`  ⚠️ HTTP 오류: ${res.status}`);
    } else {
      const xmlText = await res.text();
      const parsedItems = parseRssXml(xmlText);
      console.log(`  -> 추출 성공: ${parsedItems.length}건`);

      let newCount = 0;
      for (const item of parsedItems) {
        if (!isDuplicatePost(item, seenSet)) {
          const sid = item.sourceId || generateSourceId(item.title);
          seenSet.add(sid);
          if (item.link && !isFallbackOrEmptyUrl(item.link)) {
            seenSet.add(item.link.trim());
          }
          allCollectedItems.push(item);
          newCount++;
        }
      }
      console.log(`  -> 신규 항목 추가: ${newCount}건`);
    }
  } catch (err) {
    console.error(`  ❌ 수집 실패:`, err.message);
  }

  const mergedQueue = [...allCollectedItems, ...existingRssQueue];
  const finalQueue = mergedQueue.slice(0, 100);

  const dir = path.dirname(CITY_RSS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CITY_RSS_FILE, JSON.stringify(finalQueue, null, 2), 'utf8');

  console.log(`\n🎉 [발행 대기열 총량]: ${finalQueue.length}개 (파일: public/data/city-rss.json)`);
  return finalQueue;
}

if (require.main === module) {
  fetchYangjuRss().catch(err => {
    console.error('치명적 오류:', err);
    process.exit(1);
  });
}

module.exports = {
  fetchYangjuRss,
  parseRssXml,
  isItemExpired,
  isLowQualityNotice
};
