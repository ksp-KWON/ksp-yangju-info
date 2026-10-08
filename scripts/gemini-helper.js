/**
 * gemini-helper.js
 * Google Gemini API 공통 헬퍼 (의정부 건강·생활 정보 포털)
 *
 * [원칙] 표준 · 범용 · 콤팩트 · 통합 · 공유 · 공통
 * - Google AI Studio 공식 권장 최신 별칭(Alias) 2종 고정:
 *     PRIMARY:  gemini-flash-latest       (주력: 고품질 칼럼 집필)
 *     FALLBACK: gemini-flash-lite-latest  (경량: 기획/목차 생성 및 주력 쿼터 소진 시 무중단 폴백)
 * - URL 쿼리스트링 노출 제거 및 x-goog-api-key 헤더 보안 준수
 * - 429 PerDay 할당량 소진 시 해당 모델 인메모리 배제(exhaustedModels)로 불필요한 재호출 방지
 * - 간헐적 503 일시 장애 백오프 재시도 (2.5s -> 5s)
 */

'use strict';

const { sleep } = require('./pipeline-utils.js');

const PRIMARY_MODEL  = 'gemini-flash-latest';
const FALLBACK_MODEL = 'gemini-flash-lite-latest';

// 프로세스 실행 중 일일 한도(PerDay)가 소진된 모델을 기억하여 중복 호출 차단
const perDayExhaustedModels = new Set();
const unavailableModels = new Set();

const RETRY_CONFIG = {
  maxRetries: 2,
  backoffMs: [2500, 5000],
  retryOn: [500, 503, 529],
};

/**
 * @param {string} prompt - 보낼 프롬프트
 * @param {object|null} schema - JSON 출력용 스키마
 * @param {string} targetTier - 'lite' | 'flash' | 'auto'
 * @returns {Promise<string|object>}
 */
async function callGemini(prompt, schema = null, targetTier = 'auto') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error('GEMINI_API_KEY가 등록되지 않았거나 유효하지 않습니다.');
  }

  // 타깃 티어에 따른 우선순위 큐 (lite 요청 시 lite 먼저, 그 외 flash 먼저)
  const candidateModels = targetTier === 'lite'
    ? [FALLBACK_MODEL, PRIMARY_MODEL]
    : [PRIMARY_MODEL, FALLBACK_MODEL];

  // 이미 당일 한도 소진 또는 비정상 모델 제외
  const activeModels = candidateModels.filter(m => !perDayExhaustedModels.has(m) && !unavailableModels.has(m));
  if (activeModels.length === 0) {
    if (candidateModels.every(m => perDayExhaustedModels.has(m))) {
      const err = new Error('모든 Gemini 모델의 당일 사용 한도(PerDay Quota)가 소진되었습니다.');
      err.code = 'QUOTA_EXHAUSTED';
      err.isPerDayQuota = true;
      throw err;
    }
    throw new Error('사용 가능한 Gemini 모델이 없습니다.');
  }

  const baseConfig = {
    temperature: schema ? 0.2 : 0.75,
  };
  if (schema) {
    baseConfig.responseMimeType = 'application/json';
    baseConfig.responseSchema   = schema;
  }

  let lastError = '';

  modelLoop: for (const model of activeModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 35000);
      let res;

      try {
        console.log(`  [API] ${model} 호출 중... (시도: ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})`);
        res = await fetch(url, {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: baseConfig,
          }),
          signal: controller.signal,
        });
      } catch (networkErr) {
        lastError = `[${model}] 네트워크 에러: ${networkErr.message}`;
        console.error(`  [네트워크 오류] ${model}: ${networkErr.message.slice(0, 60)}`);
        if (attempt < RETRY_CONFIG.maxRetries) {
          await sleep(RETRY_CONFIG.backoffMs[attempt] || 2500);
          continue;
        }
        continue modelLoop;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        lastError = `[${model}] HTTP ${res.status}: ${errorText.slice(0, 100)}`;

        // 429 할당량 초과 처리
        if (res.status === 429) {
          const isPerDay = /PerDay/i.test(errorText);
          if (isPerDay) {
            console.warn(`  [할당량 초과] ${model} 일일 한도(PerDay) 소진 확인 -> 당해 프로세스 호출 목록에서 즉시 영구 배제.`);
            perDayExhaustedModels.add(model);
          } else {
            console.warn(`  [할당량 초과] ${model} 일시적 Rate Limit (분당/동시 한도) -> 쿨다운 후 차선책 모델 전환.`);
          }
          await sleep(1500);
          continue modelLoop;
        }

        // 404 모델 중단 처리
        if (res.status === 404) {
          console.warn(`  [모델 미지원] ${model} 404 발생 -> 차선책 모델로 즉시 전환.`);
          unavailableModels.add(model);
          continue modelLoop;
        }

        // 503 / 500 일시적 장애 재시도 (백오프)
        const shouldRetry = RETRY_CONFIG.retryOn.includes(res.status) && attempt < RETRY_CONFIG.maxRetries;
        if (shouldRetry) {
          const waitTime = RETRY_CONFIG.backoffMs[attempt] || 2500;
          console.warn(`  [일시적 장애] ${model} HTTP ${res.status} -> ${waitTime / 1000}초 후 재시도 (${attempt + 1}/${RETRY_CONFIG.maxRetries})`);
          await sleep(waitTime);
          continue;
        }

        console.warn(`  [호출 실패] ${model} HTTP ${res.status} -> 차순위 모델로 전환.`);
        continue modelLoop;
      }

      let data;
      try {
        data = await res.json();
      } catch {
        lastError = `[${model}] JSON 파싱 오류`;
        if (attempt < RETRY_CONFIG.maxRetries) {
          await sleep(1500);
          continue;
        }
        continue modelLoop;
      }

      console.log(`  [API 응답] model: ${model} | modelVersion: ${data?.modelVersion || 'unknown'}`);

      const candidate    = data?.candidates?.[0];
      const finishReason = candidate?.finishReason;

      if (finishReason && finishReason !== 'STOP') {
        lastError = `[${model}] 생성 미완결 (finishReason: ${finishReason})`;
        console.warn(`  [절단 감지] ${model} finishReason: ${finishReason} -> 차순위 모델 전환.`);
        continue modelLoop;
      }

      const text = (candidate?.content?.parts ?? []).map(p => p.text ?? '').join('');
      if (!text) {
        lastError = `[${model}] 빈 응답 수신`;
        continue modelLoop;
      }

      if (schema) {
        try {
          return JSON.parse(text.trim());
        } catch {
          lastError = `[${model}] JSON 스키마 파싱 오류`;
          continue modelLoop;
        }
      }

      return text;
    }
  }

  const err = new Error(`모든 Gemini 모델 통신에 실패했습니다. (마지막 에러: ${lastError})`);
  if (isAllQuotaExhausted()) {
    err.code = 'QUOTA_EXHAUSTED';
    err.isPerDayQuota = true;
  }
  throw err;
}

function isAllQuotaExhausted() {
  const allModels = [PRIMARY_MODEL, FALLBACK_MODEL];
  return allModels.length > 0 && allModels.every(m => perDayExhaustedModels.has(m));
}

async function discoverModels() {
  return [
    { name: PRIMARY_MODEL,  tier: 'flash' },
    { name: FALLBACK_MODEL, tier: 'lite' },
  ];
}

module.exports = {
  callGemini,
  discoverModels,
  isAllQuotaExhausted,
  exhaustedModels: perDayExhaustedModels,
  perDayExhaustedModels,
  unavailableModels,
  PRIMARY_MODEL,
  FALLBACK_MODEL,
  RETRY_CONFIG,
};
