# 양주인(ksp-yangju-info) 프로젝트 마스터 아키텍처 명세서

이 문서는 양주 건강·생활 정보 포털(**양주인**, `yangjuin.com`)의 시스템 아키텍처, 데이터 파이프라인, 콘텐츠 생성 및 업그레이드 엔진, 거버넌스 품질 규격을 정의합니다.

---

## 1. 프로젝트 기본 명세 및 인프라 환경

* **로컬 작업 경로**: `c:\ksp-yangju-info`
* **원격 GitHub 저장소**: `https://github.com/ksp-KWON/ksp-yangju-info.git` (기본 브랜치: `main`)
* **서비스 도메인**: `https://yangjuin.com`
* **주요 공공 데이터 원천**: 양주시청 공식 포털(`yangju.go.kr`), 경기데이터드림, 공공데이터포털 RSS 및 새소식 첨부자료
* **기술 스택**:
  - **프론트엔드**: Next.js 16.3.8 (App Router, SSG 정적 사이트 생성), React 19, Tailwind CSS, gray-matter, github-slugger
  - **콘텐츠 렌더링**: 순수 Markdown(GFM) + W3C 표준 단색 라인 SVG + 샤프 모던 UI (`rounded-none`, 사방 360° 앰비언트 울트라 딥 섀도우)
  - **배포 및 인프라**: GitHub Actions (`.github/workflows/deploy.yml`) ➔ Cloudflare Pages 정적 호스팅

---

## 2. CI/CD 및 자동화 오케스트레이션 (`.github/workflows/deploy.yml`)

1. **실행 주기 (Triggers)**:
   - 정기 스케줄: 매시간 정각 (`cron: '0 * * * *'`, 24시간 자동 순항)
   - 코드 푸시: `push` to `main` (정적 빌드 및 배포 잡만 수행)
   - 수동 실행: `workflow_dispatch` (파라미터 `force_upgrade`: `true`/`false`)
2. **2단계 파이프라인 분리 (Generate & Deploy)**:
   - `generate` 잡: 신규 글 탐색 ➔ (미발행 시) 구버전 백필 업그레이드 ➔ CQF 품질 검증 ➔ 변경 파일 안전 스테이징 및 커밋·푸시
   - `deploy` 잡: Next.js 정적 빌드(`npm run build`) ➔ Cloudflare Pages 무중단 배포 ➔ 발행/업그레이드 브리핑 이메일 자동 발송
3. **API 쿼터 분산 안전장치**:
   - 신규 글이 발행되면 구버전 업그레이드는 자동으로 다음 유휴 회차로 건너뜀
   - 신규 글이 0건이거나 `force_upgrade=true`일 때만 구버전 백필 업그레이드 가동

---

## 3. 신규 글 자동 발행 파이프라인 (`scripts/generate-blog-post.js`)

1. **데이터 수집 및 변경 감지**:
   - `scripts/fetch-city-rss.js`를 통해 양주시청 새소식 및 고시공고 RSS 수집
   - `public/data/skipped-urls.json` 대조로 기발행 및 부적합 URL 중복 스킵
2. **첨부파일 파싱 및 심층 데이터 추출**:
   - **HWPX 파서 (`parseHwpxFromBuffer`)**: HWPX ZIP 컨테이너 압축을 해제하고 내부 `Contents/section0.xml`을 추출하여 정밀 텍스트 및 표 데이터 파싱
   - **조건부 Vision OCR**: 첨부파일이 이미지 포스터이거나 텍스트가 200자 미만인 경우, Gemini Flash Vision API를 호출하여 이미지 내 일정, 장소, 자격요건 100% 텍스트화
3. **AI 본문 생성 및 프롬프트 규격**:
   - Gemini API (`scripts/gemini-helper.js`, 최신 공식 Alias 고정)
   - 양주 시빅 마스터 헌법 준수:
     - 7대 기둥(3줄 브리핑, 목차, 지원대상, 데이터 표, 신청절차, 생활꿀팁, 자주 묻는 질문)
     - 이모지 전면 배제 (W3C 라인 SVG 자동 결합), Google Blue 계층형 타이포그래피
     - 3단계 팩트 핀셋 교열로 공공기관 팩트 일치율 100% 보장

---

## 4. 구버전 단문 백필 업그레이드 엔진 (`scripts/upgrade-old-posts.js`)

초기 발행된 저밀도·단문 포스팅을 최신 E-E-A-T 및 CQF 규격으로 현행화하는 In-Place 업그레이드 시스템입니다.

1. **실행 조건 및 제약**:
   - 트리거: `published_count == 0` (신규 글 미발행 회차) 또는 `force_upgrade=true`
   - 회차당 최대 완료 수: `MAX_UPGRADE_PER_RUN = 1` (쿼터 보존 및 안정성 극대화)
   - 최대 탐색 시도: `MAX_SEARCH_ATTEMPTS = 5`
2. **대상 탐색 기준 (`getUpgradeTargets`)**:
   - `upgradedAt` 메타 미존재
   - 영구 제외 목록(`public/data/upgrade-skipped.json`) 미등록
   - 유효한 재크롤링 원문 소스(`sourceUrl` 또는 유효 `sourceBody`) 보유
   - 본문 길이 `bodyLen < 1000` 또는 마크다운 표 미보유(`!hasTable`)
3. **In-Place SEO 무결 보존**:
   - 기존 파일 경로, 파일명, URL 영문 슬러그, 최초 발행일(`date`)을 100% 영구 보존
   - Frontmatter 내 `upgradedAt: 'YYYY-MM-DD'` 단일 메타 필드만 주입
4. **3대 핵심 방어 로직 (Zero-Cost Rescue Guard)**:
   - **프롬프트 강화**: 마크다운 요약 표(`| 구분 | 내용 |`) 필수 생성 및 기존 본문(`${target.body}`) 컨텍스트 주입
   - **표 자동 복원 안전망 (Table Fallback Rescue)**: AI 생성문에서 표가 누락되더라도 기존 본문에 마크다운 표가 존재했다면 표 블록을 추출해 하단 `### 📋 핵심 요약 안내`로 자동 결합 복구
   - **품질 역전 방지 (Regression Guard)**: `finalNewLen >= 1000 || (finalNewLen >= 750 && finalNewLen >= target.bodyLen + 150)`
     - 기준 미달 또는 표 부재 시 덮어쓰기를 전면 폐기하고 `upgrade-skipped.json`에 안전 격리

---

## 5. 품질 검증 게이트 및 배포 안전성

1. **CQF 기계적 검증 (`scripts/check-quality.js`)**:
   - 대괄호 메모(`[...]`), 미승인 이모지, 메타 설명 누락, 800자 미만 등 전수 자동 검사
   - 오류 1건이라도 발생 시 빌드/배포 즉시 중단
2. **독립 메타데이터 추출기 (`scripts/extract-posts-metadata.js`)**:
   - Git 변경사항(`git diff --name-only`)을 추적하여 신규 글 및 업그레이드 글의 메타데이터(`title`, `slug`, `upgraded`)를 JSON 및 GitHub Output으로 안전 분리
3. **안전 스테이징 루프 규칙**:
   - `git add` 시 일괄 나열을 지양하고 개별 파일 존재 검증 루프 사용:
     ```bash
     for f in public/data/city-rss.json public/data/local-info.json public/data/learning-courses.json public/data/skipped-urls.json public/data/upgrade-skipped.json src/data/learning-courses.json src/content/posts/; do
       [ -e "$f" ] && git add "$f"
     done
     ```
   - 특정 JSON 파일이 미생성되었더라도 전체 커밋 파이프라인이 중단(Abort)되지 않도록 방어

---

## 6. 스마트블록·스니펫 두괄식 즉답(Answer-First) 및 `im-not-ai` 결정론적 정제 엔진 (2026-10-19~)

1. **프롬프트 헌법 고도화 (`scripts/prompt-builder.js`)**:
   - **스마트블록 & 구글 스니펫 두괄식 즉답(Answer-First) 원칙**:
     - 모든 H2(`##`) 및 H3(`###`) 소제목 바로 아래 첫 1~2문장은 상투적인 서론을 생략하고, 해당 섹션의 핵심 사실(신청 대상, 지원 금액, 접수 기간, 운영 장소 등)을 즉답하는 문장으로 시작.
   - **탈(脫) AI 담백 공공 문체 (`im-not-ai` 표준)**:
     - 과장·홍보성 수식어('획기적인', '파격적인', '막막하셨죠?'), 느낌표(`!`), '단순한 A가 아닌 B' 같은 기계적 대조 구문, 연결어미 뒤 불필요한 쉼표('~하며,', '~하고,') 전면 배제.
     - 핵심 요약 불릿(`> - **항목명** : 내용`)에서 콜론 뒤의 설명문 전체를 통째로 볼드 처리하는 행위 엄단.
   - **기획 제목(PLAN_SCHEMA) 클리셰 배제**:
     - '완벽 가이드', '총정리', '100%' 등 과장된 수식어 및 느낌표 사용을 금지하고 담백한 공공 안내 제목 생성.

2. **결정론적 정제기 SSOT 단일 통합 (`scripts/markdown-standard.js`)**:
   - `sanitizeImNotAiTitle(text)`: 제목 내 느낌표(`!`) 및 번역투/이중피동 제거.
   - `sanitizeImNotAiSummary(text)`: 요약문 내 느낌표(`!`) ➔ 마침표(`.`) 치환, 번역투(`에 있어서` ➔ `에서`), 이중피동(`되어집니다` ➔ `됩니다`, `되어지고` ➔ `되고`) 정제.
   - `sanitizeImNotAiBody(text)`: 본문 내 번역투/이중피동 치환, 연결어미 뒤 쉼표(`/(?:하며|하고|이고|으며|지만),\s+/g` ➔ `' '`), 핵심 요약 불릿 콜론 뒤 통문단 볼드(`/^(>\s*-\s*\*\*[^*\n]+\*\*\s*:\s*)\*\*([^*\n]+)\*\*$/gm` ➔ `'$1$2'`) 자동 정제.

3. **전 파이프라인 무결 연동**:
   - **신규 글 자동 발행 (`scripts/generate-blog-post.js`)**: `saveMarkdownPost` 저장 직전 제목, 요약, 본문에 결정론적 정제기를 적용하여 영구 보존.
   - **구버전 In-Place 업그레이드 (`scripts/upgrade-old-posts.js`)**: `normalizePost` 이후 최종 본문 및 메타 요약문에 단일화된 1회 정제를 적용하여 중복 연산 방지 및 무결성 확보.
