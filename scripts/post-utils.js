'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const matter = require('gray-matter');
const { POSTS_DIR } = require('./pipeline-utils');
const { normalizePost } = require('../src/lib/markdown-standard');

function generateSourceId(text) {
  return crypto.createHash('md5').update(text || '').digest('hex').slice(0, 12);
}

function getExistingSourceIds() {
  const sourceIds = new Set();
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
    return sourceIds;
  }

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    try {
      const filePath = path.join(POSTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = matter(content);
      if (parsed.data.sourceId) {
        sourceIds.add(parsed.data.sourceId);
      }
    } catch {
      // Ignore parsing errors
    }
  }
  return sourceIds;
}

function makeSlug(title, date, seq = 1) {
  const KEYWORD_MAP = {
    '의정부': 'uijeongbu', '버스킹': 'busking', '행복로': 'haengbokro',
    '청년': 'youth', '어르신': 'senior', '노인': 'senior', '장애인': 'disabled',
    '지원': 'support', '교육': 'education', '문화': 'culture', '축제': 'festival',
    '행사': 'event', '혜택': 'benefit', '창업': 'startup', '복지': 'welfare',
    '건강': 'health', '의료': 'medical', '경기': 'gyeonggi', '보육': 'childcare',
    '일자리': 'jobs', '취업': 'employment', '주거': 'housing', '환경': 'environment',
    '안전': 'safety', '교통': 'transport', '스포츠': 'sports', '도서관': 'library',
    '박물관': 'museum', '공원': 'park', '음악당': 'music-theatre', '장려금': 'grant',
  };

  let slug = String(title || '');
  for (const [kr, en] of Object.entries(KEYWORD_MAP)) {
    slug = slug.replace(new RegExp(kr, 'g'), '-' + en + '-');
  }

  slug = slug
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 50);

  if (!slug || slug === '-') slug = 'post';

  const datePrefix = date ? date + '-' : '';
  const seqSuffix = seq > 1 ? '-' + seq : '';
  return datePrefix + slug + seqSuffix;
}

function getUniqueFilePath(baseSlug) {
  let filePath = path.join(POSTS_DIR, baseSlug + '.md');
  let seq = 1;
  let currentSlug = baseSlug;
  
  while (fs.existsSync(filePath)) {
    seq++;
    currentSlug = baseSlug + '-' + seq;
    filePath = path.join(POSTS_DIR, currentSlug + '.md');
  }
  return { filePath, slug: currentSlug };
}

function saveMarkdownPost(arg1, arg2, arg3) {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  let fileName = '';
  let frontmatter = {};
  let content = '';

  if (typeof arg1 === 'string' && typeof arg2 === 'object') {
    fileName = arg1;
    frontmatter = arg2 || {};
    content = typeof arg3 === 'string' ? arg3 : '';
  } else if (typeof arg1 === 'object') {
    frontmatter = arg1 || {};
    content = typeof arg2 === 'string' ? arg2 : '';
  }

  let filePath;
  let finalSlug;

  if (fileName) {
    const cleanFileName = fileName.endsWith('.md') ? fileName : fileName + '.md';
    filePath = path.join(POSTS_DIR, cleanFileName);
    finalSlug = path.basename(filePath, '.md');
  } else {
    const baseSlug = frontmatter.slug || makeSlug(frontmatter.title || 'post');
    const unique = getUniqueFilePath(baseSlug);
    filePath = unique.filePath;
    finalSlug = unique.slug;
  }

  if (fs.existsSync(filePath)) {
    try {
      const existingRaw = fs.readFileSync(filePath, 'utf8');
      const existingParsed = matter(existingRaw);
      const existingSourceId = existingParsed.data && existingParsed.data.sourceId;
      const currentSourceId = frontmatter && frontmatter.sourceId;

      if (currentSourceId && existingSourceId !== currentSourceId) {
        const idSuffix = String(currentSourceId).slice(0, 8);
        finalSlug = `${finalSlug}-${idSuffix}`;
        filePath = path.join(POSTS_DIR, `${finalSlug}.md`);
      }
    } catch {
      // Ignore reading/parsing error
    }
  }

  const rawFileContent = matter.stringify(content || '', frontmatter);
  const normalized = normalizePost(rawFileContent);
  fs.writeFileSync(filePath, normalized.fullContent, 'utf8');
  console.log('  [저장 완료] ' + filePath);

  return { filePath, slug: finalSlug };
}

function getKSTDateString(date) {
  date = date || new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

module.exports = {
  POSTS_DIR,
  generateSourceId,
  getExistingSourceIds,
  makeSlug,
  saveMarkdownPost,
  getKSTDateString
};
