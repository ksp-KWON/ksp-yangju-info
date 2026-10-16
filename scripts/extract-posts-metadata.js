/**
 * scripts/extract-posts-metadata.js
 * 양주인 신규 발행 및 업그레이드 포스팅 메타데이터 추출 & GitHub Actions 출력 생성 엔진
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

let postFiles = [];
let isUpgrade = false;

try {
  const diffA = execSync('git diff --cached --name-status --diff-filter=A -- src/content/posts', { encoding: 'utf8' });
  const added = diffA
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('A\t') || l.startsWith('A '))
    .map(l => l.replace(/^A\s+/, ''))
    .filter(f => f.endsWith('.md'));

  if (added.length > 0) {
    postFiles = added;
  } else {
    const diffM = execSync('git diff --cached --name-status --diff-filter=M -- src/content/posts', { encoding: 'utf8' });
    const modified = diffM
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('M\t') || l.startsWith('M '))
      .map(l => l.replace(/^M\s+/, ''))
      .filter(f => f.endsWith('.md'));
    if (modified.length > 0) {
      postFiles = modified;
      isUpgrade = true;
    }
  }
} catch (e) {
  console.error('git diff 실행 오류:', e.message);
}

const count = postFiles.length;
console.log(`발행/업그레이드 글 수: ${count} (업그레이드: ${isUpgrade})`);

let subject = '';
let htmlBody = '';

if (count > 0) {
  const file = postFiles[0];
  const fullPath = path.resolve(file);
  const content = fs.readFileSync(fullPath, 'utf8');
  const parsed = matter(content);
  const title = parsed.data?.title || path.basename(file, '.md');
  const slug = path.basename(file, '.md');

  subject = isUpgrade
    ? `[양주인] 구버전 글 업그레이드 & 배포 완료: ${title}`
    : `[양주인] 자동 발행 & 배포 완료: ${title}`;

  htmlBody = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #222; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">` +
    `<h2 style="color: #111; margin-top: 0; font-size: 20px; border-bottom: 2px solid #111; padding-bottom: 12px;">🏛️ 양주인 ${isUpgrade ? '구버전 포스팅 업그레이드' : '데일리 글쓰기'} & 배포 완료</h2>` +
    `<p style="font-size: 15px; color: #4b5563;">${isUpgrade ? '기존 저품질 포스팅이 최신 7단계 시빅 가이드로 성공적으로 업그레이드되었습니다.' : '오늘자 신규 양주 시정 안내 포스팅과 웹사이트 배포가 성공적으로 완료되었습니다.'}</p>` +
    `<div style="background-color: #f9fafb; padding: 18px; border-left: 4px solid #111; margin: 20px 0; border-radius: 4px;">` +
    `<p style="font-size: 13px; color: #6b7280; margin: 0 0 6px 0; font-weight: bold;">${isUpgrade ? '업그레이드된 포스팅' : '오늘 발행된 포스팅'}</p>` +
    `<h3 style="margin: 0 0 14px 0; color: #111; font-size: 17px;">${title}</h3>` +
    `<a href="https://yangjuin.com/blog/${slug}" style="display: inline-block; padding: 10px 18px; background-color: #111; color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: bold;">웹사이트에서 바로 확인하기 →</a>` +
    `</div>` +
    `<div style="border-top: 1px solid #e5e7eb; padding-top: 14px; font-size: 12px; color: #9ca3af;">` +
    `<p style="margin: 0;">포털 주소: <a href="https://yangjuin.com" style="color: #4b5563; text-decoration: underline;">yangjuin.com</a></p>` +
    `<p style="margin: 4px 0 0 0;">본 메일은 양주 건강·생활 정보 포털 GitHub Actions에서 자동 발송되었습니다.</p>` +
    `</div></div>`;
}

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_posts_count=${count}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `subject=${subject}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `html_body<<EOF_BODY\n${htmlBody}\nEOF_BODY\n`);
}
