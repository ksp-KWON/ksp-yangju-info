/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * scripts/fetch-city-rss.js
 * 양주시 공식 블로그 RSS 통합 수집 엔진 (ksp-yangju-info)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { generateSourceId, getExistingSourceIds } = require('./post-utils');
const { safeFetch } = require('./pipeline-utils');

const CITY_RSS_FILE = path.join(process.cwd(), 'public/data/city-rss.json');
const YANGJU_RSS_URL = 'https://rss.blog.naver.com/yangju619.xml';

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
  const seenSourceIds = new Set();
  existingSourceIds.forEach(id => seenSourceIds.add(id));
  existingRssQueue.forEach(item => seenSourceIds.add(item.sourceId));

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
        if (!seenSourceIds.has(item.sourceId)) {
          seenSourceIds.add(item.sourceId);
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
};
