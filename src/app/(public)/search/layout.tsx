import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "검색 결과 - 양주 건강·생활 정보 포털",
  description: "입력하신 키워드와 관련된 양주시 생활·의료·민원 안내 및 소식을 확인하세요.",
  robots: { index: false, follow: false },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
