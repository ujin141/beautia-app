// 번역 유틸리티
// 간단한 언어 감지 및 번역 기능

/**
 * 텍스트의 언어를 감지합니다.
 * 간단한 유니코드 범위 기반 감지
 */
export function detectLanguage(text: string): string {
  if (!text || text.trim().length === 0) return 'ko';
  
  // 한글 유니코드 범위: AC00-D7AF
  const koreanPattern = /[가-힣]/;
  // 한자 범위: 4E00-9FFF
  const chinesePattern = /[\u4E00-\u9FFF]/;
  // 히라가나: 3040-309F, 가타카나: 30A0-30FF
  const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
  // 태국어: 0E00-0E7F
  const thaiPattern = /[\u0E00-\u0E7F]/;
  
  // 영어 및 기타 라틴 문자는 기본값으로 처리
  
  if (koreanPattern.test(text)) return 'ko';
  if (japanesePattern.test(text)) return 'ja';
  if (chinesePattern.test(text)) return 'zh';
  if (thaiPattern.test(text)) return 'th';
  
  // 기본값은 영어로 간주
  return 'en';
}

/**
 * Google Translate API를 사용하여 텍스트를 번역합니다.
 * 클라이언트 측에서 호출되는 함수입니다.
 */
export async function translateText(
  text: string,
  targetLanguage: string = 'ko',
  sourceLanguage?: string
): Promise<string> {
  if (!text || text.trim().length === 0) return text;
  
  // 소스 언어를 자동 감지하지 않았다면 감지
  const detectedLang = sourceLanguage || detectLanguage(text);
  
  // 같은 언어면 번역 불필요
  if (detectedLang === targetLanguage) return text;
  
  try {
    // Google Translate API 사용 (무료 버전)
    // 실제 프로덕션에서는 API 키가 필요하거나 서버 측 번역을 사용해야 합니다.
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${detectedLang}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`
    );
    
    if (!response.ok) {
      throw new Error('Translation API request failed');
    }
    
    const data = await response.json();
    
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
    
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    // 번역 실패 시 원문 반환
    return text;
  }
}

/**
 * 여러 언어로 구성된 텍스트 배열을 번역합니다.
 */
export async function translateMessages(
  texts: string[],
  targetLanguage: string = 'ko'
): Promise<string[]> {
  const translations = await Promise.all(
    texts.map(text => translateText(text, targetLanguage))
  );
  return translations;
}
