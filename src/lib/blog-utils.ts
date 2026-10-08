import GithubSlugger from 'github-slugger';

const KEY_POINT_PATTERNS = /^(?:#+\s*)?(?:[💡🔎📌\s]*)(?:시정\s*핵심\s*요약|행정\s*핵심\s*요약|핵심\s*요약|핵심\s*포인트\s*요약|3줄\s*요약|시정\s*브리핑|공연\s*핵심\s*요약|Key\s*Points)(?:[\s:]*)/i;
const CHECKLIST_PATTERNS = /^(?:#+\s*)?(?:[📋✅☑️\s]*)(?:신청\s*자격\s*1분\s*자가진단|1분\s*자가진단|자가진단|체크리스트|Checklist|체크포인트|필수\s*체크포인트|필수\s*서류\s*체크|자격\s*체크|관람\s*1분\s*체크리스트|대처\s*1분\s*체크리스트|사용처\s*1분\s*체크리스트|신청\s*1분\s*체크리스트|검진\s*당일\s*1분\s*체크리스트|교육\s*신청\s*1분\s*자가진단|긴급복지지원\s*신청\s*자격\s*1분\s*자가진단|출산\s*지원금\s*신청\s*1분\s*자가진단|상병수당\s*신청\s*1분\s*자가진단|유아학비\s*신청\s*1분\s*자가진단|월세자금보증\s*1분\s*체크리스트|축제\s*관람\s*1분\s*체크리스트|버스킹\s*관람\s*1분\s*체크리스트)/i;
const FAQ_PATTERNS = /^(?:#+\s*)?(?:[💬❓🗨️\s]*)(?:시민\s*자주\s*묻는\s*질문|자주\s*묻는\s*질문|FAQ|Q&A|질의응답)(?:[\s:]*)/i;
const ACTION_PATTERNS = /^(?:#+\s*)?(?:[🚀🔗📍👉📞\s]*)(?:공식\s*신청처\s*안내|온라인\s*신청\s*바로가기|관련\s*공공기관\s*안내|신청\s*안내)(?:[\s:]*)/i;
const TOC_PATTERNS = /^(?:#+\s*)?(?:[📜📋📑\s]*)(?:이\s*글의\s*목차\s*내비게이션|이\s*글의\s*목차|목차\s*내비게이션|목차|Table\s*of\s*Contents|TOC)(?:[\s:]*)/i;

export interface ParsedBlogPost {
  opening: string;
  keyPoints: string[];
  keyPointsTitle?: string;
  checklistItems: string[];
  checklistTitle?: string;
  faqItems: { q: string; a: string }[];
  toc: { id: string; text: string }[];
  sections: string[];
}

export function cleanHeadingText(text: string, removePrefix = false): string {
  let cleaned = text.replace(/^#+\s*/, '').replace(/^[💡🔎📌📋✅☑️💬❓🗨️🚀🔗📍👉📞🛡️🏛️\s]*/, '').trim();
  if (removePrefix) {
    cleaned = cleaned.replace(/^\d+[\.\)]\s*/, '').trim();
  }
  return cleaned;
}

export function parseBlogPost(content: string): ParsedBlogPost {
  const lines = content.split(/\r?\n/);
  const slugger = new GithubSlugger();
  
  const result: ParsedBlogPost = {
    opening: '',
    keyPoints: [],
    keyPointsTitle: '시정 핵심 요약',
    checklistItems: [],
    checklistTitle: '신청 자격 1분 자가진단',
    faqItems: [],
    toc: [],
    sections: [],
  };

  let currentSectionType: 'NONE' | 'KEY_POINTS' | 'CHECKLIST' | 'FAQ' | 'CTA' | 'TOC' = 'NONE';
  let currentSectionLines: string[] = [];
  let currentQ = '';
  let currentA = '';
  let inCodeBlock = false;
  let hasFirstHeading = false;

  const pushCurrentSection = () => {
    if (currentSectionLines.length > 0) {
      const secStr = currentSectionLines.join('\n').trim();
      if (secStr) result.sections.push(secStr);
      currentSectionLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // 0. 코드 블록 검출
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (currentSectionType === 'NONE') {
        currentSectionLines.push(line);
      }
      continue;
    }

    if (inCodeBlock) {
      if (currentSectionType === 'NONE') currentSectionLines.push(line);
      continue;
    }

    // 1. 헤딩 감지 (H2: ##, H3: ###)
    const headingMatch = trimmed.match(/^(#{2,3})\s+(.+)$/);
    
    if (headingMatch) {
      const level = headingMatch[1].length;
      const rawText = headingMatch[2].trim();

      // [FAQ 모드 내부의 H3 질문 처리]
      if (currentSectionType === 'FAQ' && level === 3) {
        if (/^(?:[*_💬❓🗨️\s]*[QA]\d*[*_]*\s*[:.-]?\s*)/i.test(rawText) || /\?$/.test(rawText)) {
          if (currentQ) {
            result.faqItems.push({ q: currentQ, a: currentA.trim() });
          }
          currentQ = rawText
            .replace(/^(?:[*_💬❓🗨️\s]*Q\d*[*_]*\s*[:.-]?\s*)/i, '')
            .replace(/^\*\*|\*\*$/g, '')
            .trim();
          currentA = '';
          continue;
        }
      }

      // 특수 H2 섹션 전환 검출
      let isSpecial = false;
      if (KEY_POINT_PATTERNS.test(rawText)) {
        currentSectionType = 'KEY_POINTS';
        result.keyPointsTitle = cleanHeadingText(rawText);
        isSpecial = true;
      } else if (CHECKLIST_PATTERNS.test(rawText)) {
        currentSectionType = 'CHECKLIST';
        result.checklistTitle = cleanHeadingText(rawText);
        isSpecial = true;
      } else if (FAQ_PATTERNS.test(rawText)) {
        if (currentQ) {
          result.faqItems.push({ q: currentQ, a: currentA.trim() });
          currentQ = ''; currentA = '';
        }
        currentSectionType = 'FAQ';
        isSpecial = true;
      } else if (ACTION_PATTERNS.test(rawText)) {
        currentSectionType = 'CTA';
        isSpecial = true;
      } else if (TOC_PATTERNS.test(rawText)) {
        currentSectionType = 'TOC';
        isSpecial = true;
      }

      if (isSpecial) continue;

      // 일반 본문 헤딩(H2 or H3)을 만났을 때 -> 특수 상태 종료
      if (currentSectionType === 'FAQ' && currentQ) {
        result.faqItems.push({ q: currentQ, a: currentA.trim() });
        currentQ = ''; currentA = '';
      }
      currentSectionType = 'NONE';

      if (level === 2) {
        const id = slugger.slug(cleanHeadingText(rawText));
        const text = cleanHeadingText(rawText, true);
        if (text) result.toc.push({ id, text });

        if (!hasFirstHeading) {
          hasFirstHeading = true;
          const opStr = currentSectionLines.join('\n').trim();
          if (opStr) result.opening = opStr;
          currentSectionLines = [line];
        } else {
          pushCurrentSection();
          currentSectionLines = [line];
        }
      } else {
        // H3는 현재 섹션 라인에 추가
        currentSectionLines.push(line);
      }
      continue;
    }

    // 2. 상태별 라인 처리
    if (currentSectionType === 'KEY_POINTS') {
      const cleanLine = trimmed.replace(/^[> \t]+/, '').trim();

      // 빈 줄이면 계속 KEY_POINTS 상태를 유지하며 다음 라인 대기 (보상스쿨 조기 탈출 방지 표준)
      if (!cleanLine) {
        continue;
      }

      // 인용구/불릿 여부 검사 (-, *, +, 이모지, > 인용구 내 볼드 등)
      const isBulletOrQuote =
        /^[-*+]\s*/.test(cleanLine) ||
        /^[🛡️💡✅☑️⭐📌]/.test(cleanLine) ||
        trimmed.startsWith('>') ||
        /^\*\*[^*]+\*\*/.test(cleanLine);

      if (isBulletOrQuote) {
        const text = cleanLine
          .replace(/^[-*+]\s*/, '')
          .replace(/^[🛡️💡✅☑️⭐📌]+\s*/, '')
          .trim();
        if (text && !/^[-=_*~]{2,}$/.test(text)) {
          result.keyPoints.push(text);
          if (result.keyPoints.length >= 3) {
            currentSectionType = 'NONE';
          }
          continue;
        }
      }

      // 불릿/인용구가 아닌 순수 일반 본문 문단이 시작되면 KEY_POINTS를 정상 종료하고 오프닝에 보존
      currentSectionType = 'NONE';
      if (!hasFirstHeading) {
        currentSectionLines.push(line);
      }
      continue;
    }

    if (currentSectionType === 'TOC') {
      const isTocLine = /^[-*+]\s*/.test(trimmed) || /^\d+[\.\)]\s*/.test(trimmed) || !trimmed;
      if (isTocLine) {
        continue;
      }
      currentSectionType = 'NONE';
      currentSectionLines.push(line);
      continue;
    }

    if (currentSectionType === 'CHECKLIST') {
      const cleanLine = trimmed.replace(/^[> \t]+/, '').trim();
      if (!cleanLine) continue;

      const isCheckItem = /^[-*+]\s*\[[ xX-]?\]/.test(cleanLine) || /^[-*+]\s+/.test(cleanLine) || /^[☑️✅\[\]]/.test(cleanLine);
      if (isCheckItem) {
        const text = cleanLine
          .replace(/^[-*+]\s*/, '')
          .replace(/^\[[ xX-]?\]\s*/i, '')
          .replace(/^[\u2611\u2705\uFE0F]+\s*/gu, '')
          .trim();
        if (text && !/^[-=_*~]{2,}$/.test(text)) {
          result.checklistItems.push(text);
          continue;
        }
      }
      continue;
    }

    if (currentSectionType === 'FAQ') {
      if (/^(?:#+\s*)?(?:[*_💬❓🗨️\s]*Q\d*[*_]*\s*[:.-]?\s*)/i.test(trimmed)) {
        if (currentQ) result.faqItems.push({ q: currentQ, a: currentA.trim() });
        currentQ = trimmed
          .replace(/^(?:#+\s*)?(?:[*_💬❓🗨️\s]*Q\d*[*_]*\s*[:.-]?\s*)/i, '')
          .replace(/^\*\*|\*\*$/g, '')
          .trim();
        currentA = '';
        continue;
      }
      if (currentQ) {
        if (trimmed !== '---') {
          const cleanLine = line
            .replace(/^\s*(?:\*\*|[*_💬❓🗨️\s])*A\d*(?:\*\*|[*_])*\s*[:.-]?\s*(?:\*\*)?\s*/i, '')
            .replace(/\*\*$/g, '');
          currentA += cleanLine + '\n';
        }
        continue;
      }
      continue;
    }

    if (currentSectionType === 'CTA') {
      continue;
    }

    if (currentSectionType === 'NONE') {
      if (/\[SEO_SUMMARY\]/.test(trimmed)) continue;

      if (/^\s*(\[|\*\*|#+\s*)?(관련\s*(정보|글|포스트)|함께\s*읽기|관련정보|관련글)(\]|\*\*|:)?\s*$/.test(trimmed)) {
        continue;
      }

      let processedLine = line;
      const singleLinkMatch = trimmed.match(/^\s*(?:[-*]\s*)?\[([^\]]+)\]\(([^)]+)\)\s*$/);
      if (singleLinkMatch) {
        const text = singleLinkMatch[1].trim();
        const href = singleLinkMatch[2].trim();
        processedLine = `<calloutlink href="${href}" text="${text}"></calloutlink>`;
      }
      
      currentSectionLines.push(processedLine);
    }
  }

  if (currentQ) {
    result.faqItems.push({ q: currentQ, a: currentA.trim() });
  }
  
  if (!hasFirstHeading) {
    const opStr = currentSectionLines.join('\n').trim();
    if (opStr) result.opening = opStr;
  } else {
    pushCurrentSection();
  }

  const sanitizeMarkdownInline = (str: string): string => {
    if (!str) return '';
    let normalized = str;
    // 3개 이상 과도한 별표 오타만 마크다운 표준 볼드(**)로 정돈 (한 줄 내 격리)
    normalized = normalized.replace(/\*{3,}([^\r\n*]+?)\*{2,}/g, '**$1**');
    normalized = normalized.replace(/\*{2,}([^\r\n*]+?)\*{3,}/g, '**$1**');
    // 괄호 내 볼드 + 한글 조사 결합 시 볼드 파싱 훼손 방지 (CommonMark 6.2 사양 대응)
    normalized = normalized.replace(/\*\*([^*\r\n()]+)\(([^)\r\n]+)\)\*\*([가-힣])/g, '**$1**($2)$3');
    return normalized;
  };
  
  result.sections = result.sections.map(sanitizeMarkdownInline);
  result.keyPoints = result.keyPoints.map(sanitizeMarkdownInline);
  result.checklistItems = result.checklistItems.map(sanitizeMarkdownInline);
  result.faqItems = result.faqItems.map(faq => ({
    q: sanitizeMarkdownInline(faq.q).replace(/^\*\*|\*\*$/g, '').trim(),
    a: sanitizeMarkdownInline(faq.a).replace(/^\s*\*\*\s*/, '').replace(/\*\*$/g, '').trim(),
  }));

  const groupRelatedLinks = (text: string) => {
    return text.replace(/(<calloutlink[^>]+>\s*<\/calloutlink>\s*)+/g, (match) => {
      return `<relatedbox>\n${match.trim()}\n</relatedbox>\n\n`;
    });
  };

  if (result.opening) {
    result.opening = groupRelatedLinks(sanitizeMarkdownInline(result.opening));
  }
  result.sections = result.sections.map(groupRelatedLinks);

  if (!result.opening && result.sections.length === 0 && content.trim()) {
    result.sections = [groupRelatedLinks(sanitizeMarkdownInline(content.trim()))];
  }

  return result;
}
