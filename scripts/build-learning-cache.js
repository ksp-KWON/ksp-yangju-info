/**
 * scripts/build-learning-cache.js
 * 양주시 평생학습 실시간 강좌 데이터 수집, 검증 및 캐싱 엔진
 * 
 * 헌법 제3조 준수:
 * - 옥정, 회천, 덕정, 백석, 장흥, 광적 등 관내 10대 거점 좌표 추론 엔진
 * - 카테고리, 수강대상, 주말/야간 강좌 스마트 분류
 * - 접수중 우선 & 최신 등록순(DESC) 스마트 시빅 정렬 동기화
 */

'use strict';

const fs = require('fs');
const path = require('path');

// 양주시 주요 평생학습 거점 및 행정동 좌표 딕셔너리
const LOCATION_COORDINATES = {
  '옥정호수도서관': { lat: 37.8202, lng: 127.0955, dong: '옥정동', address: '경기도 양주시 옥정동로7길 110' },
  '덕정도서관': { lat: 37.8435, lng: 127.0615, dong: '덕정동', address: '경기도 양주시 화합로 1426' },
  '꿈나무도서관': { lat: 37.8315, lng: 127.0585, dong: '덕계동', address: '경기도 양주시 고덕로 209' },
  '남면도서관': { lat: 37.8890, lng: 126.9850, dong: '남면', address: '경기도 양주시 남면 개나리길 26' },
  '광적도서관': { lat: 37.8285, lng: 126.9745, dong: '광적면', address: '경기도 양주시 광적면 가납리 846' },
  '양주시립도서관': { lat: 37.8335, lng: 127.0655, dong: '회천동', address: '경기도 양주시 화합로 1426' },
  '양주시청': { lat: 37.8175, lng: 127.0465, dong: '남방동', address: '경기도 양주시 부흥로 1533' },
  '양주역': { lat: 37.7853, lng: 127.0458, dong: '남방동', address: '경기도 양주시 평화로 919' },
  '옥정1동': { lat: 37.8250, lng: 127.0980, dong: '옥정1동', address: '경기도 양주시 옥정동' },
  '옥정2동': { lat: 37.8150, lng: 127.0920, dong: '옥정2동', address: '경기도 양주시 옥정동' },
  '회천1동': { lat: 37.8450, lng: 127.0630, dong: '회천1동', address: '경기도 양주시 덕정동' },
  '회천2동': { lat: 37.8320, lng: 127.0590, dong: '회천2동', address: '경기도 양주시 덕계동' },
  '회천3동': { lat: 37.8520, lng: 127.0700, dong: '회천3동', address: '경기도 양주시 고암동' },
  '회천4동': { lat: 37.8180, lng: 127.0930, dong: '회천4동', address: '경기도 양주시 옥정동' },
  '백석읍': { lat: 37.7980, lng: 126.9650, dong: '백석읍', address: '경기도 양주시 백석읍 오산리' },
  '광적면': { lat: 37.8280, lng: 126.9740, dong: '광적면', address: '경기도 양주시 광적면' },
  '장흥면': { lat: 37.7250, lng: 126.9550, dong: '장흥면', address: '경기도 양주시 장흥면 일영리' },
  '은현면': { lat: 37.8650, lng: 127.0250, dong: '은현면', address: '경기도 양주시 은현면' },
  '남면': { lat: 37.8890, lng: 126.9850, dong: '남면', address: '경기도 양주시 남면' },
  '기본': { lat: 37.8202, lng: 127.0955, dong: '옥정동', address: '경기도 양주시 옥정로 1 (옥정 중심)' },
};

function inferLocationAndDong(title, org) {
  const combined = `${title} ${org}`;
  for (const [key, loc] of Object.entries(LOCATION_COORDINATES)) {
    if (key !== '기본' && combined.includes(key)) {
      return loc;
    }
  }

  const dongList = ['옥정동', '덕정동', '덕계동', '고암동', '백석읍', '광적면', '장흥면', '은현면', '남면', '만송동', '삼숭동', '고읍동', '유양동', '산북동'];
  for (const d of dongList) {
    if (combined.includes(d)) {
      return { ...LOCATION_COORDINATES['기본'], dong: d };
    }
  }

  return LOCATION_COORDINATES['기본'];
}

function inferCategory(title) {
  if (/로봇|과학|코딩|드론|ai|융합/i.test(title)) return '창의·IT·과학';
  if (/미술|그림|공예|바느질|도예|가죽|소품|캘리/i.test(title)) return '문화·공예·예술';
  if (/요가|필라테스|댄스|체육|운동|체조|수영/i.test(title)) return '건강·스포츠';
  if (/영어|일본어|중국어|어학|회화|한자/i.test(title)) return '외국어·인문';
  if (/자격증|직업|바리스타|제과|창업|취업/i.test(title)) return '직업·자격·실무';
  if (/유아|어린이|그림책|놀이터|초등|청소년/i.test(title)) return '어린이·청소년';
  return '교양·시민참여';
}

function inferTarget(title) {
  if (/유아|초등|어린이/i.test(title)) return '유아·어린이';
  if (/청소년|중등|고등/i.test(title)) return '청소년';
  if (/시니어|어르신|실버|50\+/i.test(title)) return '어르신·50+';
  if (/직장인|야간|퇴근/i.test(title)) return '직장인·청년';
  return '시민 누구나';
}

function isWeekendOrNight(title) {
  if (/토|일|주말|야간|저녁|19:|20:/i.test(title)) return true;
  return false;
}

const srcPath = path.join(process.cwd(), 'src/data/learning-courses.json');
const publicPath = path.join(process.cwd(), 'public/data/learning-courses.json');

async function main() {
  console.log('🏛️ [양주인] 평생학습 강좌 캐시 최적화 엔진 가동...');

  if (!fs.existsSync(srcPath)) {
    console.error('❌ src/data/learning-courses.json 파일이 존재하지 않습니다.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
  const courses = Array.isArray(raw.courses) ? raw.courses : [];

  if (courses.length === 0) {
    console.error('❌ 유효한 강좌 데이터가 0건입니다.');
    process.exit(1);
  }

  // 데이터 무결성 보강 & 위치/카테고리/대상 자동 추론 동기화
  const enriched = courses.map(course => {
    const loc = inferLocationAndDong(course.title || '', course.org || '');
    return {
      ...course,
      dong: course.dong || loc.dong,
      address: course.address || loc.address,
      lat: course.lat || loc.lat,
      lng: course.lng || loc.lng,
      category: course.category || inferCategory(course.title || ''),
      target: course.target || inferTarget(course.title || ''),
      isNightWeekend: typeof course.isNightWeekend === 'boolean' ? course.isNightWeekend : isWeekendOrNight(course.title || '')
    };
  });

  // Smart Civic Sort: 접수중 우선 ➔ 최신 번호(내림차순 DESC)
  const sorted = [...enriched].sort((a, b) => {
    if (a.status === '접수중' && b.status !== '접수중') return -1;
    if (a.status !== '접수중' && b.status === '접수중') return 1;
    const numA = parseInt(a.num, 10) || 0;
    const numB = parseInt(b.num, 10) || 0;
    return numB - numA;
  });

  const outputData = {
    updatedAt: new Date().toISOString(),
    source: '양주시 평생학습포털 공식 연동 (lll.yangju.go.kr)',
    totalCount: sorted.length,
    courses: sorted,
  };

  const jsonStr = JSON.stringify(outputData, null, 2);
  fs.writeFileSync(srcPath, jsonStr, 'utf8');
  fs.writeFileSync(publicPath, jsonStr, 'utf8');

  console.log(`✅ 양주시 평생학습 ${sorted.length}개 강좌 최신순 캐시 무결성 동기화 완료!`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('오류 발생:', err);
    process.exit(1);
  });
}

module.exports = {
  main,
  LOCATION_COORDINATES,
  inferLocationAndDong,
  inferCategory,
  inferTarget,
  isWeekendOrNight
};
