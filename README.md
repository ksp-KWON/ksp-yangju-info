# 양주인 (ksp-yangju-info)

**양주사람을 위한, 양주 안(IN)의 모든 생활 — 양주인 (yangjuin.com)**

양주시민 맞춤형 건강·생활 정보 포털입니다.  
양주시 공식 블로그 RSS 및 대한민국 공공데이터포털(정부24) API를 기반으로, 양주시의 시정 소식, 복지 지원금, 축제·행사, 응급의료 정보를 실시간으로 제공합니다.

---

## 🛠️ 기술 스택 (Tech Stack)

* **프레임워크**: Next.js 16 (Turbopack, App Router, SSG 정적 빌드)
* **스타일링**: Tailwind CSS
* **호스팅**: Cloudflare Workers
* **데이터 파이프라인**: GitHub Actions 크론 자동화 (일일 시정 소식 및 복지 데이터 자동 수집/생성)

---

## 🚀 로컬 실행 (Local Development)

```bash
npm install
npm run dev
```

## 📦 프로덕션 빌드 (Production Build)

```bash
npm run build
```
