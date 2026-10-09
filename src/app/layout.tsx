import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SITE_URL, SITE_NAME, GA_MEASUREMENT_ID, NAVER_SITE_VERIFICATION } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "양주 건강·생활 정보 포털 | 응급실·건강·생활 안내",
    template: "%s | 양주 건강·생활 정보 포털",
  },
  description: "양주시 응급실 위치·전화 안내와 국가건강검진, 민원 등 생활 가이드를 정리합니다.",
  keywords: ["양주", "양주응급실", "양주건강검진", "양주민원", "양주인"],
  authors: [{ name: SITE_NAME, url: `${SITE_URL}/about` }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "양주 건강·생활 정보 포털 | 응급실·건강·생활 안내",
    description: "양주시 응급실 위치·전화 안내와 국가건강검진, 민원 등 생활 가이드를 정리합니다.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "양주 건강·생활 정보 포털",
    description: "양주시 응급실 안내와 건강·생활 가이드",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Google 공식 @graph 규격 (Organization + WebSite + SearchAction 통합 구조화 데이터)
  const globalJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        "name": SITE_NAME,
        "url": SITE_URL,
        "logo": {
          "@type": "ImageObject",
          "url": `${SITE_URL}/images/yangju-logo.svg`,
        },
        "description": "양주시 시민을 위한 공공 건강·생활 정보 및 혜택 종합 포털 양주인",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        "url": SITE_URL,
        "name": SITE_NAME,
        "publisher": {
          "@id": `${SITE_URL}/#organization`,
        },
        "inLanguage": "ko-KR",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${SITE_URL}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="ko" className="h-full antialiased overflow-x-hidden" suppressHydrationWarning>
      <head>
        {NAVER_SITE_VERIFICATION && (
          <meta name="naver-site-verification" content={NAVER_SITE_VERIFICATION} />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalJsonLd) }}
        />
        {/* 다크모드 화면 깜빡임(FOUC) 원천 차단 인라인 스크립트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'light';
                  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (_) {}
              })()
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-zinc-900 dark:bg-[#121417] dark:text-[#e8eaed] transition-colors duration-300 overflow-x-clip">
        {/* Google Analytics 4 (gtag.js) */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
