/**
 * scripts/build-weekly-digest.js
 * 양주인 최근 7일간 신규 발행 및 업그레이드 포스팅 주간 요약 이메일 빌더
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const SITE_NAME = '양주인';
const SITE_SUBTITLE = '양주 건강·생활 정보 포털';
const SITE_URL = 'https://yangjuin.com';
const ACCENT_COLOR = '#111827';
const DAYS = 7;

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatKstDate(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return parts.replace(/-/g, '.');
}

function collectWeeklyPosts() {
  const raw = execSync(
    `git -c core.quotepath=false log --since="${DAYS} days ago" --name-status --pretty=format:"===COMMIT:%cI" -- src/content/posts/`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );

  const fileMap = new Map();
  let currentCommitDate = '';

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('===COMMIT:')) {
      currentCommitDate = trimmed.slice('===COMMIT:'.length);
      continue;
    }
    const parts = trimmed.split('\t');
    if (parts.length < 2) continue;
    const status = parts[0].charAt(0);
    const filePath = status === 'R' && parts[2] ? parts[2] : parts[1];
    if (!filePath.endsWith('.md')) continue;
    if (status === 'D') continue;

    const prev = fileMap.get(filePath);
    if (!prev) {
      fileMap.set(filePath, {
        filePath,
        isNew: status === 'A',
        commitDate: currentCommitDate,
      });
    } else if (status === 'A') {
      prev.isNew = true;
    }
  }

  const added = [];
  const modified = [];

  for (const item of fileMap.values()) {
    const fullPath = path.resolve(item.filePath);
    if (!fs.existsSync(fullPath)) continue;
    try {
      const parsed = matter(fs.readFileSync(fullPath, 'utf8'));
      const slug = path.basename(item.filePath, '.md');
      const title = String(parsed.data?.title || slug).trim();
      const category = String(parsed.data?.category || '').trim();
      const dateStr = item.commitDate ? formatKstDate(new Date(item.commitDate)) : '';
      const entry = { slug, title, category, dateStr, url: `${SITE_URL}/blog/${slug}` };
      if (item.isNew) added.push(entry);
      else modified.push(entry);
    } catch (e) {
      console.warn(`메타 파싱 건너뜀 (${item.filePath}):`, e.message);
    }
  }

  return { added, modified };
}

function renderListSection(heading, badgeBg, items) {
  if (items.length === 0) return '';
  const rows = items
    .map((p, idx) => {
      const catTag = p.category
        ? `<span style="display:inline-block;padding:1px 7px;background:#f3f4f6;color:#374151;font-size:11px;font-weight:600;margin-right:6px;">${escapeHtml(p.category)}</span>`
        : '';
      return (
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">` +
        `<div style="font-size:12px;color:#6b7280;margin-bottom:3px;">${catTag}${escapeHtml(p.dateStr)}</div>` +
        `<a href="${escapeHtml(p.url)}" style="color:#111827;text-decoration:none;font-size:14px;font-weight:700;">${idx + 1}. ${escapeHtml(p.title)}</a>` +
        `</td></tr>`
      );
    })
    .join('');

  return (
    `<div style="margin:20px 0;">` +
    `<div style="font-size:14px;font-weight:800;color:${badgeBg};border-left:3px solid ${badgeBg};padding-left:8px;margin-bottom:8px;">${escapeHtml(heading)} (${items.length}건)</div>` +
    `<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;background:#ffffff;">${rows}</table>` +
    `</div>`
  );
}

const now = new Date();
const weekAgo = new Date(now.getTime() - DAYS * 24 * 60 * 60 * 1000);
const period = `${formatKstDate(weekAgo)} ~ ${formatKstDate(now)}`;
const { added, modified } = collectWeeklyPosts();
const total = added.length + modified.length;

const subject = `[${SITE_NAME}] 주간 발행 리포트 (${period}) — 신규 ${added.length}건 · 개선 ${modified.length}건`;

const emptyBox =
  total === 0
    ? `<div style="padding:18px;background:#f9fafb;border:1px solid #e5e7eb;color:#4b5563;font-size:14px;margin:18px 0;">최근 7일간 신규 발행 또는 업그레이드된 포스팅이 없습니다. 자동화 파이프라인 정상 대기 중입니다.</div>`
    : '';

const htmlBody =
  `<div style="font-family:-apple-system,BlinkMacSystemFont,'Malgun Gothic','Segoe UI',sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;background:#ffffff;">` +
  `<div style="border-bottom:2px solid ${ACCENT_COLOR};padding-bottom:12px;margin-bottom:16px;">` +
  `<div style="font-size:12px;color:#6b7280;font-weight:600;">${escapeHtml(SITE_SUBTITLE)} · 매주 월요일 12시 주간 브리핑</div>` +
  `<h2 style="margin:4px 0 0 0;font-size:20px;color:${ACCENT_COLOR};">${escapeHtml(SITE_NAME)} 주간 발행 리포트</h2>` +
  `<div style="font-size:13px;color:#4b5563;margin-top:4px;">집계 기간 : ${escapeHtml(period)} (최근 ${DAYS}일)</div>` +
  `</div>` +
  `<table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr>` +
  `<td style="width:50%;padding:12px;background:#f8fafc;border:1px solid #e5e7eb;text-align:center;"><div style="font-size:12px;color:#6b7280;">신규 발행</div><div style="font-size:22px;font-weight:800;color:#1a73e8;">${added.length}건</div></td>` +
  `<td style="width:50%;padding:12px;background:#f8fafc;border:1px solid #e5e7eb;text-align:center;"><div style="font-size:12px;color:#6b7280;">기존 글 업그레이드</div><div style="font-size:22px;font-weight:800;color:#111827;">${modified.length}건</div></td>` +
  `</tr></table>` +
  emptyBox +
  renderListSection('신규 발행 포스팅', '#1a73e8', added) +
  renderListSection('기존 글 업그레이드', '#374151', modified) +
  `<div style="border-top:1px solid #e5e7eb;padding-top:14px;margin-top:20px;font-size:12px;color:#9ca3af;">` +
  `<p style="margin:0;">포털 바로가기 : <a href="${SITE_URL}" style="color:#4b5563;text-decoration:underline;">${SITE_URL.replace(/^https?:\/\//, '')}</a></p>` +
  `<p style="margin:4px 0 0 0;">본 메일은 매주 월요일 낮 12시(KST) GitHub Actions에서 자동 발송됩니다.</p>` +
  `</div></div>`;

console.log(`${subject} (총 ${total}건)`);

if (process.env.GITHUB_OUTPUT) {
  const delim = `EOF_WEEKLY_${Date.now()}`;
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `total_count=${total}\n` +
      `subject=${subject}\n` +
      `html_body<<${delim}\n${htmlBody}\n${delim}\n`
  );
}
