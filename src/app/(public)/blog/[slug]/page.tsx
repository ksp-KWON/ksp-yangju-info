import fs from 'fs';
import path from 'path';
import { getPostData, getSortedPostsData } from '@/lib/posts';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import BlogPostClient from '@/components/blog/BlogPostClient';
import { parseBlogPost } from '@/lib/blog-utils';
import AppIcon from '@/components/ui/AppIcon';
import Link from 'next/link';
import ExpiredNoticeBanner from '@/components/blog/ExpiredNoticeBanner';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostData(slug);

  if (!post) {
    return {
      title: '페이지를 찾을 수 없습니다',
    };
  }

  const title = post.title;
  const description = post.summary || `${post.title}에 관한 상세 안내입니다.`;
  const url = `${SITE_URL}/blog/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'ko_KR',
      type: 'article',
      ...(post.date ? { publishedTime: post.date } : {}),
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostData(slug);

  if (!post) {
    notFound();
  }

  const sourceLink = post.sourceLink || '';

  let totalCourses = 0;
  try {
    const lPath = path.join(process.cwd(), 'src/data/learning-courses.json');
    if (fs.existsSync(lPath)) {
      totalCourses = JSON.parse(fs.readFileSync(lPath, 'utf8')).totalCount || 0;
    }
  } catch {}

  // 1. Google E-E-A-T BlogPosting & GovernmentService 스키마
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary || `${post.title}에 관한 상세 안내입니다.`,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${slug}`,
    },
  };

  // 2. BreadcrumbList 스키마
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '홈',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '생활 소식 및 혜택',
        item: `${SITE_URL}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${SITE_URL}/blog/${slug}`,
      },
    ],
  };

  // 3. FAQPage 스키마 (구글 검색결과 FAQ 리치 스니펫, 보상스쿨 SSOT 표준 일원화)
  const { faqItems: faqs } = parseBlogPost(post.content);
  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q.replace(/[*#_]/g, '').trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a.replace(/\*\*/g, '').replace(/<[^>]*>/g, '').trim(),
      },
    })),
  } : null;

  // 카테고리별 테마 뱃지 스타일
  const getCategoryBadgeClass = (categoryName: string) => {
    const clean = categoryName.replace(/^[^\s]+\s/, '');
    if (clean.includes('문화') || clean.includes('공연') || clean.includes('축제')) {
      return 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
    if (clean.includes('일자리') || clean.includes('복지') || clean.includes('돌봄')) {
      return 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    }
    if (clean.includes('교통') || clean.includes('주차')) {
      return 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
    if (clean.includes('기업') || clean.includes('경제') || clean.includes('농업')) {
      return 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
    if (clean.includes('청소') || clean.includes('환경')) {
      return 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800';
    }
    if (clean.includes('주택') || clean.includes('재개발')) {
      return 'bg-orange-50 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    }
    if (clean.includes('재난') || clean.includes('안전') || clean.includes('민방위')) {
      return 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800';
    }
    if (clean.includes('체육') || clean.includes('공원')) {
      return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    return 'bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800';
  };

  return (
    <div className="w-full space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      {/* 상단 네비게이션 브레드크럼 */}
      <nav className="mb-2">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:white transition-colors"
        >
          <AppIcon name="chevron-left" size={16} strokeWidth={2} />
          <span>전체 생활 소식 목록</span>
        </Link>
      </nav>

      {/* 메인 칼럼 아티클 (부모 SmartStickyLayout 73% 본문 폭에 100% 핏, 보상스쿨 동기화) */}
      <article className="w-full bg-white dark:bg-[#202124] rounded-none shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-gray-200/90 dark:border-zinc-800 overflow-hidden relative">
        <ExpiredNoticeBanner expiresAt={post.expiresAt} sourceLink={sourceLink} />
        <div className="px-3.5 py-6 sm:px-8 sm:py-9 space-y-7">
          {/* 아티클 헤더 (구역 1: 카테고리/날짜 메타, 구역 2: H1 타이틀, 구역 3: 포스트 요약 리드문) */}
          <header className="border-b border-gray-100 dark:border-zinc-800 pb-7">
            <div className="flex flex-wrap items-center gap-2.5 text-xs mb-3.5">
              {Array.isArray(post.category) ? (
                post.category.map((cat) => (
                  <span
                    key={cat}
                    className={`px-2.5 py-1 rounded-none font-bold border shadow-2xs ${getCategoryBadgeClass(cat)}`}
                  >
                    {cat.replace(/^[^\s]+\s/, '')}
                  </span>
                ))
              ) : post.category ? (
                <span className={`px-2.5 py-1 rounded-none font-bold border shadow-2xs ${getCategoryBadgeClass(post.category as string)}`}>
                  {(post.category as string).replace(/^[^\s]+\s/, '')}
                </span>
              ) : null}
              <time dateTime={post.date} className="text-zinc-500 dark:text-zinc-400 font-medium tracking-wide flex items-center gap-1 ml-auto">
                <AppIcon name="calendar" size={14} strokeWidth={2} />
                <span>{post.date}</span>
              </time>
            </div>

            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-[26px] font-extrabold tracking-tight text-zinc-950 dark:text-white leading-snug break-keep">
              {post.title}
            </h1>

            {post.summary && (
              <p className="text-[14.5px] sm:text-[15.5px] text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed mt-3.5 pt-3.5 border-t border-gray-100/80 dark:border-zinc-800/80 break-keep">
                {post.summary}
              </p>
            )}
          </header>

          {/* 블로그 본문 (TOC & Markdown & ShareButtons & Tags 일체화) */}
          <BlogPostClient content={post.content} title={post.title} sourceLink={sourceLink} tags={post.tags} totalCourses={totalCourses} />
        </div>
      </article>
    </div>
  );
}
