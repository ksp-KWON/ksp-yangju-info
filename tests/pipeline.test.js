const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const zlib = require('node:zlib');

const { validateSourceNumbers, crawlSourceBody, parseZipCentralDirectory, extractHwpxText } = require('../scripts/pipeline-utils');
const { sanitizeCalendarDays } = require('../scripts/markdown-standard');

describe('Pipeline Core Test Suite', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = http.createServer((req, res) => {
      if (req.url === '/naver') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html><body>
            <div class="se-main-container">
              <p>네이버 블로그 공고 본문 내용입니다. 지원 대상과 신청 일정을 안내해 드립니다.</p>
            </div>
            <!-- SE_DOC_FOOTER_START -->
            <div class="post-footer">하단 푸터 영역입니다.</div>
          </body></html>
        `);
      } else if (req.url === '/homepage') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html><body>
            <nav>
              <a href="#">바로가기</a>
              <a href="#">메뉴</a>
              <a href="#">QUICK</a>
              <a href="#">로그인</a>
              <a href="#">사이트맵</a>
              <a href="#">개인정보처리방침</a>
            </nav>
            <main>
              <p>포털 메인 홈페이지 내용입니다. 바로가기 메뉴 사이트맵 COPYRIGHT</p>
            </main>
          </body></html>
        `);
      } else if (req.url === '/article') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html><body>
            <article>
              <h2>시정 공고 상세 안내</h2>
              <p>시민 대상 공공복지 혜택과 구비 서류 목록 안내 본문입니다.</p>
            </article>
          </body></html>
        `);
      } else if (req.url === '/bod-view') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html><body>
            <div class="bod_view">
              <div class="view_cont">
                <h3>의정부시청 공고 상세 안내</h3>
                <p>시민 복지 혜택과 신청 서류 안내입니다.</p>
              </div>
            </div>
            <footer>하단 정보</footer>
          </body></html>
        `);
      } else if (req.url === '/nav-list') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html><body>
            <div id="content">
              <ul>
                <li><a href="#">바로가기</a></li>
                <li><a href="#">메뉴</a></li>
                <li><a href="#">QUICK</a></li>
                <li><a href="#">사이트맵</a></li>
              </ul>
              <p>목록 페이지입니다.</p>
            </div>
          </body></html>
        `);
      } else if (req.url === '/alert-page') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html><head>
            <script>alert("비정상적인 접근입니다."); history.back();</script>
          </head><body></body></html>
        `);
      } else if (req.url === '/deleted-page') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html><body>
            <div class="error_box">
              <p>삭제되었거나 존재하지 않는 게시물입니다.</p>
            </div>
          </body></html>
        `);
      } else if (req.url === '/404') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('Not Found');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('OK');
      }
    });

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  describe('1. validateSourceNumbers', () => {
    const source = '소득 기준 및 지원 금액: 최대 4만 원 지급 안내';

    test('소스 "최대 4만 원" 에 본문 "40,000원" 통과', () => {
      const markdown = '본 지원금은 최대 40,000원까지 차등 지급됩니다.';
      const violations = validateSourceNumbers(markdown, source);
      assert.deepEqual(violations, []);
    });

    test('소스 "최대 4만 원" 에 본문 "5만 원" 차단', () => {
      const markdown = '본 지원금은 최대 5만 원까지 지급됩니다.';
      const violations = validateSourceNumbers(markdown, source);
      assert.ok(violations.length > 0, '5만 원 위반이 감지되어야 함');
      assert.ok(violations.some((v) => v.includes('5만 원') || v.includes('5만원')));
    });

    test('숫자 없는 문장 통과', () => {
      const markdown = '본 사업은 관내 주민 여러분의 생활 안정을 위해 추진되는 사업입니다.';
      const violations = validateSourceNumbers(markdown, source);
      assert.deepEqual(violations, []);
    });

    // 시각 동치 테스트 케이스
    test('시각 동치: 소스 "1000-2100" 에 본문 "10시 21시" 통과', () => {
      assert.deepEqual(validateSourceNumbers('운영 시간 10시 21시', '1000-2100'), []);
    });

    test('시각 동치: 소스 "0900-2100" 에 본문 "09시 21시" 통과', () => {
      assert.deepEqual(validateSourceNumbers('운영 시간 09시 21시', '0900-2100'), []);
    });

    test('시각 동치: 소스 "오후 6시" 에 본문 "18:00" 통과', () => {
      assert.deepEqual(validateSourceNumbers('통제 시간 18:00', '오후 6시'), []);
    });

    test('시각 동치: 소스 "낮 12시부터 오후 5시" 에 본문 "12:00 17:00" 통과', () => {
      assert.deepEqual(validateSourceNumbers('운영 시간 12:00 17:00', '낮 12시부터 오후 5시'), []);
    });

    test('시각 동치: 소스 "오전 9시 30분" 에 본문 "09:30" 통과', () => {
      assert.deepEqual(validateSourceNumbers('시작 시각 09:30', '오전 9시 30분'), []);
    });

    test('시각 동치 위반: 소스 "오후 6시" 에 본문 "19:00" 차단', () => {
      assert.deepEqual(validateSourceNumbers('종료 시각 19:00', '오후 6시'), ['19:00']);
    });

    test('시각 동치 위반: 소스 "2026년" 에 본문 "20:26" 차단', () => {
      assert.deepEqual(validateSourceNumbers('시간 20:26', '2026년'), ['20:26']);
    });

    test('시각 동치 위반: 소스 "1000-2100" 에 본문 "11시" 차단', () => {
      assert.deepEqual(validateSourceNumbers('시간 11시', '1000-2100'), ['11시']);
    });

    test('시각 동치 위반: 소스 "오후 5시" 에 본문 "05:00" 차단', () => {
      assert.deepEqual(validateSourceNumbers('시간 05:00', '오후 5시'), ['05:00']);
    });
  });

  describe('2. sanitizeCalendarDays', () => {
    test('일치 요일 유지', () => {
      // 2026년 10월 14일은 수요일
      const input = '신청 기간은 2026년 10월 14일(수)까지입니다.';
      const output = sanitizeCalendarDays(input);
      assert.equal(output, input);
    });

    test('불일치 요일 삭제', () => {
      // 2026년 10월 14일은 수요일인데 월요일로 표기된 경우
      const input = '신청 마감일은 2026년 10월 14일(월) 오후 6시입니다.';
      const expected = '신청 마감일은 2026년 10월 14일 오후 6시입니다.';
      const output = sanitizeCalendarDays(input);
      assert.equal(output, expected);
    });

    test('요일 없는 날짜 무변경', () => {
      const input = '접수 일자는 2026년 10월 14일입니다.';
      const output = sanitizeCalendarDays(input);
      assert.equal(output, input);
    });
  });

  describe('3. crawlSourceBody', () => {
    test('네이버 se-main-container 형태 HTML 에서 본문 반환', async () => {
      const res = await crawlSourceBody(`${baseUrl}/naver`);
      assert.ok(res.text.length > 0, '본문 텍스트가 존재해야 함');
      assert.ok(res.text.includes('네이버 블로그 공고 본문'));
      assert.ok(!res.text.includes('하단 푸터 영역'), '푸터는 제외되어야 함');
    });

    test('네비 문구가 많은 홈페이지형 HTML 에서 빈 문자열 반환', async () => {
      const res = await crawlSourceBody(`${baseUrl}/homepage`);
      assert.equal(res.text, '');
    });

    test('article 태그 공고 HTML 에서 본문 반환', async () => {
      const res = await crawlSourceBody(`${baseUrl}/article`);
      assert.ok(res.text.length > 0, '본문 텍스트가 존재해야 함');
      assert.ok(res.text.includes('시정 공고 상세 안내'));
      assert.ok(res.text.includes('공공복지 혜택과 구비 서류'));
    });

    test('bod_view 및 view_cont 컨테이너 공고 HTML 에서 본문 반환', async () => {
      const res = await crawlSourceBody(`${baseUrl}/bod-view`);
      assert.ok(res.text.length > 0, '본문 텍스트가 존재해야 함');
      assert.ok(res.text.includes('의정부시청 공고 상세 안내'));
      assert.ok(!res.text.includes('하단 정보'), '푸터 영역은 제외되어야 함');
    });

    test('네비가 많은 목록 페이지 HTML 에서 빈 문자열 반환', async () => {
      const res = await crawlSourceBody(`${baseUrl}/nav-list`);
      assert.equal(res.text, '');
    });

    test('알림창(alert/history.back) 페이지에서 빈 문자열 반환', async () => {
      const res = await crawlSourceBody(`${baseUrl}/alert-page`);
      assert.equal(res.text, '');
    });

    test('컨테이너 없는 삭제 안내 페이지에서 빈 문자열 반환', async () => {
      const res = await crawlSourceBody(`${baseUrl}/deleted-page`);
      assert.equal(res.text, '');
    });

    test('404 에서 빈 문자열 반환', async () => {
      const res = await crawlSourceBody(`${baseUrl}/404`);
      assert.equal(res.text, '');
    });

    test('접속 불가 포트에서 예외 없이 빈 문자열 반환', async () => {
      // 127.0.0.1:1 은 통상 연결 거부(ECONNREFUSED)되는 포트
      const res = await crawlSourceBody('http://127.0.0.1:1');
      assert.equal(res.text, '');
      assert.equal(res.imageCount, 0);
      assert.deepEqual(res.attachments, []);
    });
  });

  describe('4. parseZipCentralDirectory & extractHwpxText', () => {
    function createMockZip(entries) {
      const localHeaders = [];
      const cdHeaders = [];
      let offset = 0;

      for (const ent of entries) {
        const fnBuf = Buffer.from(ent.name, 'utf8');
        const compData = zlib.deflateRawSync(Buffer.from(ent.data, 'utf8'));

        const lh = Buffer.alloc(30 + fnBuf.length + compData.length);
        lh.writeUInt32LE(0x04034b50, 0);
        lh.writeUInt16LE(20, 4);
        lh.writeUInt16LE(0, 6);
        lh.writeUInt16LE(8, 8);
        lh.writeUInt16LE(0, 10);
        lh.writeUInt16LE(0, 12);
        lh.writeUInt32LE(0, 14);
        lh.writeUInt32LE(compData.length, 18);
        lh.writeUInt32LE(ent.data.length, 22);
        lh.writeUInt16LE(fnBuf.length, 26);
        lh.writeUInt16LE(0, 28);
        fnBuf.copy(lh, 30);
        compData.copy(lh, 30 + fnBuf.length);

        const cd = Buffer.alloc(46 + fnBuf.length);
        cd.writeUInt32LE(0x02014b50, 0);
        cd.writeUInt16LE(20, 4);
        cd.writeUInt16LE(20, 6);
        cd.writeUInt16LE(0, 8);
        cd.writeUInt16LE(8, 10);
        cd.writeUInt16LE(0, 12);
        cd.writeUInt16LE(0, 14);
        cd.writeUInt32LE(0, 16);
        cd.writeUInt32LE(compData.length, 20);
        cd.writeUInt32LE(ent.data.length, 24);
        cd.writeUInt16LE(fnBuf.length, 28);
        cd.writeUInt16LE(0, 30);
        cd.writeUInt16LE(0, 32);
        cd.writeUInt16LE(0, 34);
        cd.writeUInt16LE(0, 36);
        cd.writeUInt32LE(0, 38);
        cd.writeUInt32LE(offset, 42);
        fnBuf.copy(cd, 46);

        localHeaders.push(lh);
        cdHeaders.push(cd);
        offset += lh.length;
      }

      const allLh = Buffer.concat(localHeaders);
      const allCd = Buffer.concat(cdHeaders);
      const cdOffset = allLh.length;
      const cdSize = allCd.length;

      const eocd = Buffer.alloc(22);
      eocd.writeUInt32LE(0x06054b50, 0);
      eocd.writeUInt16LE(0, 4);
      eocd.writeUInt16LE(0, 6);
      eocd.writeUInt16LE(entries.length, 8);
      eocd.writeUInt16LE(entries.length, 10);
      eocd.writeUInt32LE(cdSize, 12);
      eocd.writeUInt32LE(cdOffset, 16);
      eocd.writeUInt16LE(0, 20);

      return Buffer.concat([allLh, allCd, eocd]);
    }

    test('비-section 엔트리 압축 해제 스킵 및 section 엔트리 추출 검증', () => {
      const mockZip = createMockZip([
        { name: 'header.xml', data: '<header>스킵 대상</header>' },
        { name: 'BinData/image1.png', data: 'binary image data should be skipped' },
        { name: 'Contents/section0.xml', data: '<hp:p><hp:t>2026년 공고문 본문 내용입니다.</hp:t></hp:p>' },
        { name: 'Contents/section1.xml', data: '<hp:p><hp:t>문의처: 031-828-1234</hp:t></hp:p>' }
      ]);

      const sections = parseZipCentralDirectory(mockZip);
      assert.equal(sections.length, 2, '오직 section0, section1 2개만 추출되어야 함');
      assert.deepEqual(sections.map(s => s.filename), ['Contents/section0.xml', 'Contents/section1.xml']);

      const extracted = extractHwpxText(mockZip);
      assert.ok(extracted.includes('2026년 공고문 본문 내용입니다.'));
      assert.ok(extracted.includes('문의처: 031-828-1234'));
      assert.ok(!extracted.includes('스킵 대상'));
    });

    test('비정상 버퍼 및 빈 버퍼 안전 처리', () => {
      assert.deepEqual(parseZipCentralDirectory(null), []);
      assert.deepEqual(parseZipCentralDirectory(Buffer.from('not-a-zip')), []);
      assert.equal(extractHwpxText(Buffer.from('')), '');
    });
  });

  describe('프롬프트 빌더 헌법 규칙 검증', () => {
    const { buildContentPrompt } = require('../scripts/prompt-builder');

    test('buildContentPrompt (가)(나)(다) 신규 규칙 반영 및 옛 규칙 제거 검증', () => {
      const sampleItem = {
        title: '테스트 공고',
        sourceBody: '테스트 본문 내용입니다. 문의처: 031-828-1234'
      };
      const samplePlan = {
        frontmatter: {
          title: '테스트 기획 제목',
          category: '일자리·생활',
          summary: '테스트 요약문'
        },
        thoughtProcess: '기획 연쇄 사고'
      };
      const sampleAngle = {
        name: '시민 안내 관점',
        instruction: '필수 정보를 정확하게 전달하십시오.'
      };

      const prompt = buildContentPrompt(sampleItem, samplePlan, sampleAngle);

      // (가) 실무 정보 누락 없이 포함 및 구조화 재구성 문구 검증
      assert.ok(
        prompt.includes('소스 본문에 명시된 신청자 실무 정보(문의 전화·담당 부서, 신청·접수 방법, 필수 동의서·보호자 동의, 안전·보험·면책 안내, 결제·환불, 주차, 중복 신청 제한)를 해당할 때 누락 없이 포함하되'),
        '(가) 실무 정보 포함 및 재구성 지시 문구가 포함되어야 함'
      );

      // (나) 문의 전화·담당 부서 명시 시 본문 포함 및 미명시 시 하단 박스 안내 검증
      assert.ok(
        prompt.includes('소스에 문의 전화·담당 부서가 명시돼 있으면 본문에 포함하고, 명시돼 있지 않을 때만 하단 박스로 안내한다'),
        '(나) 문의 전화 본문 포함 규칙이 포함되어야 함'
      );

      // (다) 소스에 없는 대상 제한이나 포괄 표현('관내', '누구나', '시민' 한정, '모두') 금지 검증
      assert.ok(
        prompt.includes("소스에 없는 대상 제한이나 포괄 표현('관내', '누구나', '시민' 한정, '모두')을 쓰지 않는다"),
        '(다) 관내/누구나/시민 한정 표현 금지 규칙이 포함되어야 함'
      );

      // 옛 문구 부재 검증
      assert.ok(
        !prompt.includes('확인되지 않은 문의 및 접수는 글 하단의 공식 접수처 박스에서 확인하도록만'),
        '옛 문의처 제한 문구가 남아있지 않아야 함'
      );
    });
  });
});

