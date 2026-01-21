import { NextRequest, NextResponse } from 'next/server';

type Language = 'ko' | 'en' | 'ja' | 'th' | 'zh';

// 문자열 유사도 계산 (레벤슈타인 거리 기반)
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// 레벤슈타인 거리 계산
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// 간단한 번역 함수 (실제 프로덕션에서는 Google Translate API 또는 다른 번역 서비스 사용)
async function translateText(text: string, targetLang: Language, sourceLang: Language = 'ko'): Promise<string> {
  if (!text.trim()) return '';
  if (targetLang === sourceLang) {
    console.log(`같은 언어라 번역하지 않음: ${sourceLang} -> ${targetLang}`);
    return text;
  }

  try {
    // MyMemory Translation API 사용 (무료 번역 서비스)
    // 텍스트가 너무 길면 잘라서 처리 (API 제한)
    const maxLength = 500;
    const textToTranslate = text.length > maxLength ? text.substring(0, maxLength) : text;
    
    // 언어 코드 매핑 (MyMemory API가 지원하는 형식)
    const langCodeMap: Record<string, string> = {
      'ko': 'ko',
      'en': 'en',
      'ja': 'ja',
      'th': 'th',
      'zh': 'zh',
    };
    
    const sourceCode = langCodeMap[sourceLang] || sourceLang;
    const targetCode = langCodeMap[targetLang] || targetLang;
    
    // 같은 언어면 번역하지 않음
    if (sourceCode === targetCode) {
      console.log(`같은 언어 코드: ${sourceCode} === ${targetCode}`);
      return text;
    }
    
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=${sourceCode}|${targetCode}`;
    console.log(`번역 API 호출: langpair=${sourceCode}|${targetCode}, text="${textToTranslate.substring(0, 50)}..."`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`Translation API failed: ${response.status} ${response.statusText}`);
      return text;
    }

    const data = await response.json();
    console.log('번역 API 응답:', JSON.stringify(data).substring(0, 300));
    
    // 응답 검증
    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
      let translated = data.responseData.translatedText.trim();
      
      // 번역 품질 체크
      const matchScore = data.responseData.match || 0;
      
      // 번역 결과가 원본과 완전히 동일하면 원본 반환 (번역 실패로 간주)
      if (translated === textToTranslate || translated === text) {
        console.warn('번역 결과가 원본과 동일함 - 번역 실패로 간주');
        return text;
      }
      
      // 번역 품질이 너무 낮으면 (match score < 0.6) 번역하지 않음
      if (matchScore < 0.6) {
        console.warn(`번역 품질이 너무 낮음 (match: ${matchScore}) - 번역 결과를 사용하지 않음: "${translated.substring(0, 50)}..."`);
        return text;
      }
      
      // 번역 결과가 이상하게 짧거나 길면 (원본의 20% 미만 또는 300% 초과) 원본 반환
      if (translated.length < textToTranslate.length * 0.2 || translated.length > textToTranslate.length * 3) {
        console.warn(`번역 결과 길이가 비정상적 (원본: ${textToTranslate.length}, 번역: ${translated.length}) - 번역 결과를 사용하지 않음`);
        return text;
      }
      
      // 번역 결과에 원본과 동일한 부분이 90% 이상이면 번역하지 않음 (거의 번역되지 않음)
      const similarity = calculateSimilarity(textToTranslate.toLowerCase(), translated.toLowerCase());
      if (similarity > 0.9) {
        console.warn(`번역 결과가 원본과 너무 유사함 (similarity: ${similarity}) - 번역 실패로 간주`);
        return text;
      }
      
      // 번역 결과가 원본과 전혀 다른 내용인지 체크 (키워드 기반)
      // 원본에 특정 단어가 없는데 번역에 있으면 이상한 번역일 가능성
      const originalWords = textToTranslate.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
      const translatedWords = translated.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
      
      // 단일 단어인 경우 (예: "hello") 특별 처리
      if (originalWords.length === 1) {
        // 단일 단어 번역의 경우, 번역 결과가 너무 길거나 원본과 전혀 관련 없으면 무시
        if (translatedWords.length > 5) {
          console.warn(`단일 단어 번역 결과가 너무 김 (원본: "${textToTranslate}", 번역: "${translated}") - 번역 결과를 사용하지 않음`);
          return text;
        }
        
        // 원본 단어가 번역 결과에 포함되어 있으면 이상한 번역 (예: "hello" -> "hello name is ...")
        if (translated.toLowerCase().includes(textToTranslate.toLowerCase()) && translated.length > textToTranslate.length * 2) {
          console.warn(`번역 결과에 원본이 포함되어 있으면서 너무 김 (원본: "${textToTranslate}", 번역: "${translated}") - 번역 결과를 사용하지 않음`);
          return text;
        }
      }
      
      // 번역 결과가 의심스러울 경우 원본 반환
      // MyMemory API가 잘못된 번역을 반환하는 경우가 있음
      if (matchScore < 0.7 && similarity < 0.1) {
        console.warn(`번역 품질이 낮고 원본과 유사도가 매우 낮음 (match: ${matchScore}, similarity: ${similarity}) - 번역 결과를 사용하지 않음`);
        return text;
      }
      
      if (matchScore < 0.75) {
        console.warn(`번역 품질이 낮을 수 있음 (match: ${matchScore}): "${translated.substring(0, 50)}..."`);
      }
      
      // 원본이 길었으면 나머지 추가 (번역되지 않은 부분)
      if (text.length > maxLength) {
        translated += text.substring(maxLength);
      }
      
      console.log(`번역 성공 (match: ${matchScore}, similarity: ${similarity}): "${text.substring(0, 30)}..." -> "${translated.substring(0, 30)}..."`);
      return translated;
    }

    // 에러 응답 처리
    if (data.responseStatus && data.responseStatus !== 200) {
      console.error(`번역 API 에러: ${data.responseStatus} - ${data.responseMessage || 'Unknown error'}`);
    } else {
      console.warn('번역 응답에 translatedText가 없음:', JSON.stringify(data).substring(0, 200));
    }
    
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLang, sourceLang = 'ko' } = body;

    console.log('번역 API 요청:', { text, targetLang, sourceLang });

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: '텍스트와 목표 언어가 필요합니다.' },
        { status: 400 }
      );
    }

    // 여러 언어로 한 번에 번역
    if (Array.isArray(targetLang)) {
      const translations: Record<string, string> = {};
      await Promise.all(
        targetLang.map(async (lang: Language) => {
          translations[lang] = await translateText(text, lang, sourceLang as Language);
        })
      );
      return NextResponse.json({ translations });
    }

    const translated = await translateText(text, targetLang as Language, sourceLang as Language);
    console.log('번역 결과:', { original: text, translated, targetLang, sourceLang });
    
    return NextResponse.json({ translated });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: '번역 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
