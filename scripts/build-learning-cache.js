/**
 * 의정부시 평생학습 통합플랫폼(뉴런) 실시간 강좌 데이터 수집 및 캐싱 엔진
 * 
 * sugang.ull.or.kr에서 '접수중' 및 '접수예정' 활성 강좌를 안전하게 수집하여
 * 각 강좌별 상세 정보(소개글, 시간표, 수강료, 장소)를 포함한 정형화된 JSON 캐시 파일로 구축합니다.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sha1(str) {
  return crypto.createHash('sha1').update(str).digest('hex');
}

// 의정부시 주요 평생학습 거점 및 행정동 좌표 딕셔너리
const LOCATION_COORDINATES = {
  '청소년수련관': { lat: 37.7475, lng: 127.0435, dong: '의정부2동', address: '의정부시 호국로 1315' },
  '의정부시평생학습원': { lat: 37.7385, lng: 127.0465, dong: '의정부1동', address: '의정부시 평화로 540' },
  '의정부정보도서관': { lat: 37.7348, lng: 127.0392, dong: '의정부2동', address: '의정부시 의정부2동 502' },
  '의정부과학도서관': { lat: 37.7538, lng: 127.0705, dong: '신곡2동', address: '의정부시 신곡2동 442-1' },
  '의정부미술도서관': { lat: 37.7408, lng: 127.0970, dong: '송산2동', address: '의정부시 민락동 880' },
  '의정부음악도서관': { lat: 37.7285, lng: 127.0545, dong: '장암동', address: '의정부시 장암동 406' },
  '의정부가재울도서관': { lat: 37.7512, lng: 127.0335, dong: '가능동', address: '의정부시 가능동 199-1' },
  '민락노블랜드': { lat: 37.7412, lng: 127.0985, dong: '송산2동', address: '의정부시 용민로 374' },
  '송산3동': { lat: 37.7455, lng: 127.0945, dong: '송산3동', address: '의정부시 민락동' },
  '신곡1동': { lat: 37.7315, lng: 127.0555, dong: '신곡1동', address: '의정부시 신곡1동' },
  '신곡2동': { lat: 37.7485, lng: 127.0685, dong: '신곡2동', address: '의정부시 신곡2동' },
  '호원1동': { lat: 37.7125, lng: 127.0485, dong: '호원1동', address: '의정부시 호원1동' },
  '호원2동': { lat: 37.7255, lng: 127.0425, dong: '호원2동', address: '의정부시 호원2동' },
  '장암동': { lat: 37.7185, lng: 127.0535, dong: '장암동', address: '의정부시 장암동' },
  '가능동': { lat: 37.7525, lng: 127.0345, dong: '가능동', address: '의정부시 가능동' },
  '흥선동': { lat: 37.7435, lng: 127.0315, dong: '흥선동', address: '의정부시 흥선동' },
  '녹양동': { lat: 37.7655, lng: 127.0385, dong: '녹양동', address: '의정부시 녹양동' },
  '자금동': { lat: 37.7615, lng: 127.0725, dong: '자금동', address: '의정부시 자금동' },
  '고산동': { lat: 37.7295, lng: 127.1085, dong: '고산동', address: '의정부시 고산동' },
  '아띠미술': { lat: 37.7420, lng: 127.0650, dong: '신곡동', address: '의정부시 신곡동' },
  '힐링센터': { lat: 37.7380, lng: 127.0450, dong: '의정부1동', address: '의정부시 평화로 540' },
  '기본': { lat: 37.7381, lng: 127.0337, dong: '의정부동', address: '의정부시 시민로 1 (시청)' },
};

function inferLocationAndDong(title, org) {
  const combined = `${title} ${org}`;
  for (const [key, loc] of Object.entries(LOCATION_COORDINATES)) {
    if (key !== '기본' && combined.includes(key)) {
      return loc;
    }
  }

  const dongList = ['의정부1동', '의정부2동', '호원1동', '호원2동', '장암동', '신곡1동', '신곡2동', '송산1동', '송산2동', '송산3동', '자금동', '가능동', '흥선동', '녹양동', '고산동'];
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

async function fetchPage(pageIndex, stateCode = '1') {
  const url = 'https://sugang.ull.or.kr/ilms/learning/learningList.do';
  const body = new URLSearchParams({
    searchCondition: '1',
    e_search_arr: stateCode,
    pageUnit: '50',
    pageIndex: String(pageIndex),
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch sugang list: ${res.status}`);
  }

  return await res.text();
}

async function fetchCourseDetail(learningId) {
  if (!learningId) return null;
  try {
    const res = await fetch('https://sugang.ull.or.kr/ilms/learning/learningDetail.do', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ learning_id: learningId }).toString()
    });
    const html = await res.text();

    const dls = [...html.matchAll(/<dl[^>]*>([\s\S]*?)<\/dl>/gi)];
    const detailData = {};
    for (const dl of dls) {
      const dtMatch = dl[1].match(/<dt[^>]*>([\s\S]*?)<\/dt>/i);
      const ddMatch = dl[1].match(/<dd[^>]*>([\s\S]*?)<\/dd>/i);
      if (dtMatch && ddMatch) {
        const key = dtMatch[1].replace(/<[^>]+>/g, '').trim();
        const val = ddMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        detailData[key] = val;
      }
    }

    return {
      time: detailData['교육시간'] || '',
      fee: detailData['수강료'] || '',
      materialFee: detailData['재료비'] || '',
      placeDetail: detailData['교육장소상세'] || '',
      tel: detailData['문의전화'] || '',
      intro: detailData['강좌소개'] || '',
      payMethod: detailData['결제방법'] || '',
      targetGroup: detailData['교육대상'] || '',
      turns: detailData['회차'] || '',
    };
  } catch {
    return null;
  }
}

function parseCourseRows(html) {
  const courses = [];
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  for (let i = 1; i < rows.length; i++) {
    const rowHtml = rows[i][1];

    const numMatch = rowHtml.match(/<td>\s*([0-9]+)\s*<\/td>/i);
    const idNum = numMatch ? numMatch[1].trim() : String(Date.now() + i);

    const titMatch = rowHtml.match(/<span class="tit"[^>]*>([\s\S]*?)<\/span>/i);
    if (!titMatch) continue;
    let title = titMatch[1].replace(/<[^>]+>/g, '').replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();

    const orgMatch = rowHtml.match(/<span class="org"[^>]*>([\s\S]*?)<\/span>/i);
    const org = orgMatch ? orgMatch[1].replace(/<[^>]+>/g, '').trim() : '의정부시평생학습원';

    const eduPeriodMatch = rowHtml.match(/<em class="hidden">교육기간<\/em>\s*([0-9.~ \t\r\n]+)/i);
    const eduPeriod = eduPeriodMatch ? eduPeriodMatch[1].replace(/\s+/g, ' ').trim() : '일정 공지 참조';

    const applyPeriodMatch = rowHtml.match(/<em class="hidden">일반 인터넷접수<\/em>\s*([0-9.~ \t\r\n]+)/i);
    const applyPeriod = applyPeriodMatch ? applyPeriodMatch[1].replace(/\s+/g, ' ').trim() : '접수중';

    const capMatch = rowHtml.match(/<em class="hidden">인터넷 총모집인원<\/em>\s*([^<\r\n]+)/i);
    const capacity = capMatch ? capMatch[1].trim() : '정원 마감 시까지';

    let status = '접수중';
    if (rowHtml.includes('접수예정')) status = '접수예정';
    else if (rowHtml.includes('접수마감')) status = '접수마감';

    let applyUrl = 'https://sugang.ull.or.kr/ilms/learning/officeMainList.do';
    let learningId = null;
    const detailIdMatch = rowHtml.match(/fn_learning_detail\(['"]([^'"]+)['"]\)/);
    const exUrlMatch = rowHtml.match(/fn_learning_ex_detail\(['"]([^'"]+)['"]\)/);

    if (detailIdMatch && detailIdMatch[1]) {
      learningId = detailIdMatch[1];
      applyUrl = `https://sugang.ull.or.kr/ilms/learning/learningDetail.do?learning_id=${detailIdMatch[1]}`;
    } else if (exUrlMatch && exUrlMatch[1]) {
      applyUrl = exUrlMatch[1];
    }

    const loc = inferLocationAndDong(title, org);
    const category = inferCategory(title);
    const target = inferTarget(title);
    const isNightWeekend = isWeekendOrNight(title);
    const isFree = !rowHtml.includes('유료') && !title.includes('유료');

    courses.push({
      num: idNum,
      learningId,
      title,
      org,
      dong: loc.dong,
      address: loc.address,
      lat: loc.lat,
      lng: loc.lng,
      eduPeriod,
      applyPeriod,
      capacity,
      status,
      category,
      target,
      isFree,
      isNightWeekend,
      applyUrl,
      time: '일정 공지 참조',
      fee: isFree ? '무료' : '유료 (강의계획서 참조)',
      materialFee: '강의계획서 참조',
      tel: '031-826-9988',
      intro: '',
    });
  }

  return courses;
}

async function main() {
  console.log(' 의정부시 평생학습원 실시간 강좌 캐시 수집 시작...');
  const prevPath = path.join(__dirname, '../src/data/learning-courses.json');
  const prevById = new Map();
  try {
    if (fs.existsSync(prevPath)) {
      const prevData = JSON.parse(fs.readFileSync(prevPath, 'utf8'));
      if (Array.isArray(prevData.courses)) {
        for (const c of prevData.courses) {
          if (c && c.id) prevById.set(c.id, c);
        }
      }
    }
  } catch {
    // 파싱 실패 시 빈 Map 유지
  }
  const allCourses = [];

  try {
    for (let page = 1; page <= 3; page++) {
      console.log(`📡 [페이지 ${page}] 데이터 수신 중...`);
      const html = await fetchPage(page, '1');
      const courses = parseCourseRows(html);
      if (courses.length === 0) break;
      allCourses.push(...courses);
    }

    const seenLearningIds = new Set();
    const usedIds = new Set();
    const finalCourses = [];

    for (const raw of allCourses) {
      if (raw.learningId) {
        if (seenLearningIds.has(raw.learningId)) {
          console.warn(`[중복 learningId 제외] "${raw.title}" (${raw.learningId})`);
          continue;
        }
        seenLearningIds.add(raw.learningId);
        const id = `ujb-${raw.learningId.toLowerCase()}`;
        usedIds.add(id);
        finalCourses.push({ id, ...raw });
      } else {
        const base = `ujb-x-${sha1(`${raw.title}|${raw.org}|${raw.eduPeriod}`).slice(0, 10)}`;
        let candidateId = base;
        let suffix = 2;
        while (usedIds.has(candidateId)) {
          console.warn(`[ID 충돌 접미 처리] "${raw.title}" (${candidateId} -> ${base}-${suffix})`);
          candidateId = `${base}-${suffix}`;
          suffix++;
        }
        usedIds.add(candidateId);
        finalCourses.push({ id: candidateId, ...raw });
      }
    }

    console.log(` 총 ${finalCourses.length}개 강좌 목록 추출 완료! 상위 강좌 세부 커리큘럼 수집 중...`);

    // 상위 30개 강좌의 상세 정보 병렬 수집
    const detailTargets = finalCourses.filter(c => c.learningId).slice(0, 30);
    const BATCH_SIZE = 5;
    for (let i = 0; i < detailTargets.length; i += BATCH_SIZE) {
      const chunk = detailTargets.slice(i, i + BATCH_SIZE);
      await Promise.all(chunk.map(async (course) => {
        const detail = await fetchCourseDetail(course.learningId);
        if (detail) {
          if (detail.time) course.time = detail.time;
          if (detail.fee) {
            course.fee = detail.fee;
            const hasNumericFee = /[1-9]/.test(detail.fee);
            course.isFree = !hasNumericFee && (detail.fee.includes('무료') || detail.fee.includes('0원'));
          }
          if (detail.materialFee) course.materialFee = detail.materialFee;
          if (detail.tel) course.tel = detail.tel;
          if (detail.intro) course.intro = detail.intro;
          if (detail.placeDetail) course.address = `${course.address} (${detail.placeDetail})`;
        }
      }));
    }

    console.log(` 세부 커리큘럼 및 수강료 동기화 완료!`);

    let preservedCount = 0;
    const detailFields = ['time', 'fee', 'isFree', 'materialFee', 'tel', 'intro', 'address'];
    for (const c of finalCourses) {
      if (!c.intro) {
        const prev = prevById.get(c.id);
        if (prev && prev.intro) {
          for (const k of detailFields) {
            if (prev[k] !== undefined) c[k] = prev[k];
          }
          preservedCount++;
        }
      }
    }
    if (preservedCount > 0) {
      console.log(`ℹ️ 상세 정보 누락 방지: 이전 캐시에서 ${preservedCount}건의 상세 정보를 보존했습니다.`);
    }

    if (finalCourses.length === 0) {
      console.error('❌ 유효한 강좌 데이터가 0건입니다. 파일 쓰기를 중단합니다.');
      process.exit(1);
    }

    const srcDataDir = path.join(__dirname, '../src/data');
    const publicDataDir = path.join(__dirname, '../public/data');
    if (!fs.existsSync(srcDataDir)) fs.mkdirSync(srcDataDir, { recursive: true });
    if (!fs.existsSync(publicDataDir)) fs.mkdirSync(publicDataDir, { recursive: true });

    const srcPath = path.join(srcDataDir, 'learning-courses.json');
    const publicPath = path.join(publicDataDir, 'learning-courses.json');

    if (fs.existsSync(srcPath)) {
      try {
        const existingData = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
        if (JSON.stringify(existingData.courses) === JSON.stringify(finalCourses)) {
          console.log('ℹ️ 기존 강좌 캐시와 내용이 완전히 동일합니다. (쓰기 생략)');
          return;
        }
      } catch {
        // 기존 파일 파싱 실패 시 새로 쓰기 계속
      }
    }

    const outputData = {
      updatedAt: new Date().toISOString(),
      source: '의정부도시교육재단 평생학습 통합플랫폼 (sugang.ull.or.kr)',
      totalCount: finalCourses.length,
      courses: finalCourses,
    };

    fs.writeFileSync(srcPath, JSON.stringify(outputData, null, 2), 'utf8');
    fs.writeFileSync(publicPath, JSON.stringify(outputData, null, 2), 'utf8');

    console.log(` 캐시 파일 생성 성공: ${srcPath} (${(fs.statSync(srcPath).size / 1024).toFixed(1)} KB)`);
  } catch (error) {
    console.error('❌ 강좌 데이터 수집 중 오류 발생:', error);
    process.exit(1);
  }
}

main();
