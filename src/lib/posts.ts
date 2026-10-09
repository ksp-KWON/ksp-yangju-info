import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { cache } from 'react';
import { PostData, PostMeta } from './types';

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

/**
 * 안전하게 날짜를 문자열(YYYY-MM-DD)로 변환하는 함수
 * - 한국 시간(KST, UTC+9) 기준 시차를 보정하여 하루 전으로 밀리는 현상을 원천 방어합니다.
 */
export function formatDate(dateVal: unknown): string {
  if (!dateVal) return '';
  // 1. 이미 YYYY-MM-DD 표준 문자열인 경우: Date 파싱 없이 즉시 반환하여 타임존 왜곡 원천 차단
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
    return dateVal.trim();
  }
  try {
    let d: Date;
    if (dateVal instanceof Date) {
      d = dateVal;
    } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
      d = new Date(dateVal);
    } else {
      d = new Date(String(dateVal));
    }
    if (!isNaN(d.getTime())) {
      const kstTime = new Date(d.getTime() + 9 * 60 * 60 * 1000);
      return kstTime.toISOString().split('T')[0];
    }
  } catch {
    // 날짜 파싱 실패 시 원본 문자열 반환
  }
  return String(dateVal);
}

// 빌드 및 런타임 디스크 I/O 최적화를 위한 인메모리 캐시
let cachedPosts: PostData[] | null = null;

function parsePostMetadata(slug: string, matterResult: matter.GrayMatterFile<string>): PostData {
  const dateStr = formatDate(matterResult.data.date);
  const updatedAtStr = matterResult.data.updatedAt ? formatDate(matterResult.data.updatedAt) : undefined;
  const expiresAtStr = matterResult.data.expiresAt ? formatDate(matterResult.data.expiresAt) : undefined;

  let categoryArray: string[] = [];
  if (matterResult.data.category) {
    if (Array.isArray(matterResult.data.category)) {
      categoryArray = matterResult.data.category;
    } else if (typeof matterResult.data.category === 'string') {
      categoryArray = matterResult.data.category.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  return {
    slug,
    title: matterResult.data.title || '',
    date: dateStr,
    updatedAt: updatedAtStr,
    summary: matterResult.data.summary || '',
    category: categoryArray,
    subCategory: matterResult.data.subCategory ? String(matterResult.data.subCategory) : undefined,
    tags: Array.isArray(matterResult.data.tags)
      ? matterResult.data.tags.filter((t): t is string => typeof t === 'string')
      : [],
    sourceLink: matterResult.data.sourceLink || '',
    published: matterResult.data.published !== false,
    content: matterResult.content,
    expiresAt: expiresAtStr,
  };
}

// 전체 마크다운 파일을 최초 1회만 디스크에서 읽어 파싱하는 캐싱 헬퍼 함수
function getAllPosts(): PostData[] {
  if (cachedPosts) {
    return cachedPosts;
  }

  try {
    if (!fs.existsSync(postsDirectory)) {
      return [];
    }
    const fileNames = fs.readdirSync(postsDirectory);
    const result = fileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .map((fileName) => {
        const slug = fileName.replace(/\.md$/, '');
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const matterResult = matter(fileContents);
        return parsePostMetadata(slug, matterResult);
      });

    cachedPosts = result;
    return result;
  } catch (error) {
    console.error('Error reading posts directory: ', error);
    return [];
  }
}

/**
 * 전체 블로그 목록을 날짜 최신순으로 가져오는 함수
 * - [성능 최적화] 무거운 content 본문을 제외한 PostMeta[]를 반환하여 메모리 및 RSC 페이로드를 대폭 절감합니다.
 */
export function getSortedPostsData(includeUnpublished = false): PostMeta[] {
  const allPosts = getAllPosts();
  const allPostsData: PostMeta[] = allPosts
    .filter((post) => includeUnpublished || post.published !== false)
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
      updatedAt: post.updatedAt,
      summary: post.summary,
      category: post.category,
      subCategory: post.subCategory,
      tags: post.tags,
      sourceLink: post.sourceLink,
      published: post.published,
      expiresAt: post.expiresAt,
    }));

  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

/**
 * 단일 블로그 상세 데이터를 가져오는 함수 (본문 content 포함)
 */
export function getPostData(slug: string, includeUnpublished = false): PostData | null {
  const allPosts = getAllPosts();
  const post = allPosts.find((p) => p.slug === slug);
  if (!post) {
    return null;
  }

  if (post.published === false && !includeUnpublished) {
    return null;
  }

  return post;
}

/**
 * 전체 블로그 글의 태그 출현 빈도를 집계하여 반환하는 캐싱 헬퍼 함수
 */
export const getSortedTagsData = cache((): string[] => {
  const posts = getSortedPostsData(false);
  const tagCounts: Record<string, number> = {};
  for (const post of posts) {
    if (post.tags) {
      for (const tag of post.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
  }
  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
});

/**
 * 전체 블로그 글의 실제 카테고리 목록을 글 수가 많은 순, 같으면 이름 순으로 집계하여 반환하는 함수
 */
export function getActiveCategories(): string[] {
  const posts = getSortedPostsData(false);
  const countMap: Record<string, number> = {};
  for (const post of posts) {
    if (post.category) {
      const cats = Array.isArray(post.category)
        ? post.category
        : typeof post.category === 'string'
        ? (post.category as string).split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      for (const cat of cats) {
        countMap[cat] = (countMap[cat] || 0) + 1;
      }
    }
  }
  return Object.keys(countMap).sort((a, b) => {
    const diff = countMap[b] - countMap[a];
    if (diff !== 0) return diff;
    return a.localeCompare(b, 'ko');
  });
}

