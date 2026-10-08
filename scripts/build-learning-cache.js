/**
 * scripts/build-learning-cache.js
 * 양주시 평생학습 강좌 데이터 검증 및 캐시 최적화 엔진 (ksp-yangju-info)
 * 
 * 헌법 제3조 준수:
 * - 옥정, 회천, 덕정, 백석, 장흥 등 관내 10대 거점 강좌 데이터 무결성 검증
 * - 접수중 우선 & 최신 등록순(DESC) 스마트 시빅 정렬 동기화
 */

'use strict';

const fs = require('fs');
const path = require('path');

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

  // Smart Civic Sort: 접수중 우선 ➔ 최신 번호(내림차순 DESC)
  const sorted = [...courses].sort((a, b) => {
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

  console.log(`✅ 양주시 평생학습 ${sorted.length}개 강좌 최신순 캐시 동기화 완료!`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('오류 발생:', err);
    process.exit(1);
  });
}

module.exports = { main };
