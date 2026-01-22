import { NextRequest, NextResponse } from 'next/server';

type Language = 'ko' | 'en' | 'ja' | 'th' | 'zh';

interface TranslationRequest {
  text: string;
  description?: string;
  targetLangs: Language[];
  sourceLang?: Language;
}

// GPT-4o를 사용한 번역 함수
async function translateWithGPT(
  text: string,
  description: string | undefined,
  targetLangs: Language[],
  sourceLang: Language = 'ko'
): Promise<Record<string, { name: string; description?: string }>> {
  if (!text.trim()) {
    return {};
  }

  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.warn('OPENAI_API_KEY가 설정되지 않음. 기본 번역 API 사용');
      // GPT-4o가 없으면 기존 번역 API 사용
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: targetLangs, sourceLang }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const result: Record<string, { name: string; description?: string }> = {};
        targetLangs.forEach(lang => {
          if (data.translations && data.translations[lang]) {
            result[lang] = { name: data.translations[lang] };
            if (description) {
              // 설명도 번역
              result[lang].description = data.translations[lang]; // 임시로 같은 값 사용
            }
          }
        });
        return result;
      }
      return {};
    }

    // GPT-4o API 호출
    const languageNames: Record<Language, string> = {
      ko: 'Korean',
      en: 'English',
      ja: 'Japanese',
      th: 'Thai',
      zh: 'Chinese (Simplified)',
    };

    const targetLangNames = targetLangs.map(lang => languageNames[lang]).join(', ');
    
    const currentDate = new Date().toISOString().split('T')[0];
    
    const prompt = `You are an expert translator specializing in beauty, spa, and wellness services with up-to-date knowledge of current trends, terminology, and cultural nuances as of ${currentDate}. 

Translate the following menu information from ${languageNames[sourceLang]} to ${targetLangNames} using the most current and natural expressions in each target language.

IMPORTANT GUIDELINES:
- Use the latest beauty/spa industry terminology and trends (2024-2025)
- Consider cultural context and local preferences for each target language
- Ensure translations sound natural and professional, not literal
- Use terminology that local customers would actually use
- For beauty services, use industry-standard terms that are currently popular
- Maintain the marketing appeal and persuasiveness of the original text

Menu Name: "${text}"
${description ? `Menu Description: "${description}"` : ''}

Please provide translations in JSON format with both "name" and "description" fields:
{
  "en": { "name": "...", ${description ? '"description": "..."' : ''} },
  "ja": { "name": "...", ${description ? '"description": "..."' : ''} },
  "th": { "name": "...", ${description ? '"description": "..."' : ''} },
  "zh": { "name": "...", ${description ? '"description": "..."' : ''} }
}

Only include the languages requested: ${targetLangs.join(', ')}.
${description ? 'Translate both the menu name and description accurately, maintaining the marketing appeal.' : 'Translate only the menu name.'}

Ensure all translations reflect current (2024-2025) beauty industry standards and natural language usage.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-2024-11-20', // 최신 GPT-4o 모델 사용 (2024년 11월 버전)
        messages: [
          {
            role: 'system',
            content: `You are an expert translator for beauty and spa services with up-to-date knowledge of current industry trends, terminology, and cultural nuances as of ${new Date().toISOString().split('T')[0]}. Always respond with valid JSON only. Use the most current and natural expressions that reflect 2024-2025 beauty industry standards.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4, // 약간 높여서 더 자연스러운 번역 생성
        max_tokens: 1500, // 토큰 수 증가로 더 긴 설명 번역 지원
        response_format: { type: 'json_object' }, // JSON 형식 강제 (최신 API 기능)
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content from OpenAI');
    }

    // JSON 파싱 (response_format이 json_object인 경우 직접 파싱)
    let translations: any;
    try {
      // JSON 형식으로 응답이 오는 경우
      translations = JSON.parse(content);
    } catch (e) {
      // 마크다운 코드 블록이 있는 경우 제거 후 파싱
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      translations = JSON.parse(jsonMatch[0]);
    }
    
    // 결과 정리
    const result: Record<string, { name: string; description?: string }> = {};
    targetLangs.forEach(lang => {
      if (translations[lang]) {
        result[lang] = {
          name: translations[lang].name || translations[lang],
          description: translations[lang].description,
        };
      }
    });

    return result;
  } catch (error) {
    console.error('GPT-4o translation error:', error);
    // 폴백: 기존 번역 API 사용
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: targetLangs, sourceLang }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const result: Record<string, { name: string; description?: string }> = {};
        targetLangs.forEach(lang => {
          if (data.translations && data.translations[lang]) {
            result[lang] = { name: data.translations[lang] };
          }
        });
        return result;
      }
    } catch (fallbackError) {
      console.error('Fallback translation also failed:', fallbackError);
    }
    
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslationRequest = await request.json();
    const { text, description, targetLangs, sourceLang = 'ko' } = body;

    if (!text || !targetLangs || !Array.isArray(targetLangs)) {
      return NextResponse.json(
        { error: '텍스트와 목표 언어 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    const translations = await translateWithGPT(text, description, targetLangs, sourceLang);
    
    return NextResponse.json({ 
      success: true,
      translations 
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '번역 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}
