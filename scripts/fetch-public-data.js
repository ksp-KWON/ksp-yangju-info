/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * fetch-public-data.js (의정부 로컬인포 v2)
 * 공공데이터포털 API에서 의정부/경기 관련 정보 1건을 수집하여
 * public/data/local-info.json에 저장합니다.
 *
 * 변경 이력:
 * v2 - 폴백 전체반환 제거: 의정부/경기 데이터가 없으면 정상 종료
 *    - gemini-helper.js 공통 모듈 사용 (지능형 재시도/모델 폴오버)
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { callGemini } = require('./gemini-helper');
const { sleep, safeFetch } = require('./pipeline-utils');

// ── 필터링 상수 ─────────────────────────────────────────────────────────────
// 1순위: 의정부 키워드
const UIJEONGBU_KEYWORDS = ['양주', '양주시'];
// 2순위: 경기도 키워드 (의정부 없을 때만)
const GYEONGGI_KEYWORDS  = ['경기도', '경기'];

/**
 * API 응답 아이템이 키워드 목록 중 하나를 포함하는지 확인합니다.
 */
function matchesKeywords(item, keywords) {
  const searchFields = [item.서비스명, item.서비스목적요약, item.지원대상, item.소관기관명];
  return keywords.some(kw =>
    searchFields.some(field => field && field.includes(kw))
  );
}

async function main() {
  const apiKey    = process.env.PUBLIC_DATA_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !geminiKey) {
    console.error('오류: PUBLIC_DATA_API_KEY 또는 GEMINI_API_KEY가 설정되지 않았습니다.');
    process.exit(1);
  }

  // ── [1단계 & 2단계] 공공데이터 API 호출 및 필터링 ──────────────────────────────────────────
  let filtered = [];
  let page = 1;
  const MAX_PAGES = 10;

  while (page <= MAX_PAGES && filtered.length === 0) {
    const url = `https://api.odcloud.kr/api/gov24/v3/serviceList?page=${page}&perPage=100&returnType=JSON&serviceKey=${encodeURIComponent(apiKey)}`;
    let items = [];
    
    try {
      console.log(`  [API] 공공데이터포털 서비스 목록 수집 중... (페이지 ${page}/${MAX_PAGES})`);
      const response = await safeFetch(url, {}, 12000);
      if (!response.ok) {
        throw new Error(`공공데이터 API 오류: HTTP ${response.status}`);
      }
      const data = await response.json();
      items = data.data || [];
      console.log(`  [완료] 총 ${items.length}건 수신.`);
    } catch (err) {
      console.error('오류 발생:', err.message);
      break;
    }

    filtered = items.filter(item => matchesKeywords(item, UIJEONGBU_KEYWORDS));

    if (filtered.length === 0) {
      console.log('  [필터] 의정부 관련 데이터 없음. 경기도 범위로 재검색...');
      filtered = items.filter(item => matchesKeywords(item, GYEONGGI_KEYWORDS));
    }

    if (filtered.length > 0) {
      console.log(`  [필터] 관련 데이터 ${filtered.length}건 확인.`);
      break; // 찾았으면 루프 종료
    }
    
    console.log(`  [필터] 페이지 ${page}에 새로운 데이터가 없습니다. 다음 페이지 검색...`);
    page++;
    await sleep(500); // API 과부하 방지
  }

  if (filtered.length === 0) {
    console.log('새로운 데이터가 없습니다 (최대 페이지까지 의정부/경기 관련 데이터를 찾을 수 없음)');
    return;
  }

  // ── [3단계] 기존 데이터와 비교 (중복 제거) ───────────────────────────────
  const localInfoPath = path.join(process.cwd(), 'public/data/local-info.json');
  let localInfo = { events: [], benefits: [], lastUpdated: '' };

  if (fs.existsSync(localInfoPath)) {
    localInfo = JSON.parse(fs.readFileSync(localInfoPath, 'utf8'));
  }

  const existingNames = new Set([
    ...localInfo.events.map(e => e.title),
    ...localInfo.benefits.map(b => b.title),
  ]);

  // 아직 처리되지 않은 신규 항목 탐색
  const newItem = filtered.find(item => !existingNames.has(item.서비스명));

  if (!newItem) {
    console.log('새로운 데이터가 없습니다 (모두 이미 수집됨)');
    return;
  }

  console.log(`  [신규] "${newItem.서비스명}" 항목을 처리합니다.`);

  // ── [4단계] Gemini AI로 신규 항목 1건 가공 ──────────────────────────────
  const today = new Date().toISOString().split('T')[0];

  const ITEM_SCHEMA = {
    type: 'OBJECT',
    properties: {
      id:        { type: 'INTEGER' },
      name:      { type: 'STRING' },
      category:  { type: 'ARRAY', items: { type: 'STRING' }, description: '가장 적합한 카테고리 1~2개 배열' },
      startDate: { type: 'STRING' },
      endDate:   { type: 'STRING' },
      location:  { type: 'STRING' },
      target:    { type: 'STRING' },
      summary:   { type: 'STRING' },
      link:      { type: 'STRING' },
    },
    required: ['id', 'name', 'category', 'startDate', 'endDate', 'location', 'target', 'summary', 'link'],
  };

  const prompt = `아래 공공데이터 1건을 분석해서 JSON 객체로 변환하세요.
category는 다음 8개 중 가장 적합한 것을 1~2개 선택하여 배열(Array)로 넣으세요:
['복지·지원금', '문화·행사', '교육·육아', '건강·의료', '일자리·창업', '주거·부동산', '교통·환경', '생활·민원']
startDate가 없으면 오늘 날짜(${today}), endDate가 없으면 '상시'로 넣으세요.
link는 상세URL이 없으면 빈 문자열("")로 넣으세요.

데이터:
${JSON.stringify(newItem, null, 2)}`;

  let parsedItem;
  try {
    parsedItem = await callGemini(prompt, ITEM_SCHEMA);
  } catch (err) {
    console.error('오류 발생:', err.message);
    process.exit(1);
  }

  // ── [5단계] 기존 데이터에 추가 및 저장 ──────────────────────────────────
  const finalItem = {
    id:        String(parsedItem.id || Date.now()),
    title:     parsedItem.name,
    category:  parsedItem.category,
    startDate: parsedItem.startDate,
    endDate:   parsedItem.endDate,
    location:  parsedItem.location,
    target:    parsedItem.target,
    summary:   parsedItem.summary,
    link:      parsedItem.link || '#',
  };

  if (finalItem.category === '행사') {
    localInfo.events.unshift(finalItem);
  } else {
    localInfo.benefits.unshift(finalItem);
  }

  localInfo.lastUpdated = today;

  const dir = path.dirname(localInfoPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(localInfoPath, JSON.stringify(localInfo, null, 2), 'utf8');

  console.log(`데이터 추가 성공: [${finalItem.category}] ${finalItem.title}`);
}

main().catch(err => {
  console.error('치명적 오류:', err.message);
  process.exit(1);
});
