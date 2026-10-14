const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { validateSourceNumbers, crawlSourceBody } = require('../scripts/pipeline-utils');
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
});
