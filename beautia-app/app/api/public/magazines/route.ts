import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Magazine from '@/models/Magazine';

/**
 * 매거진 API (전환율 최적화)
 * - 참여 유지 요소 강화
 * - 최신 매거진 우선
 * - 인기 카테고리 우선
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const lang = searchParams.get('lang') || 'ko'; // 언어 파라미터 (기본값: ko)
    
    // 필터 조건 구성
    const filter: any = {
      isPublished: true, // 발행된 매거진만
    };
    
    if (category) {
      filter.category = category;
    }
    
    // 매거진 조회 (더 많이 가져와서 정렬)
    const magazines = await Magazine.find(filter)
      .sort({ 
        createdAt: -1, // 최신순 우선
      })
      .limit(limit * 2);
    
    // 매거진 정렬 (참여 유지 요소 고려)
    const sortedMagazines = magazines.sort((a, b) => {
      // 1순위: 최신 매거진
      if (a.createdAt > b.createdAt) return -1;
      if (a.createdAt < b.createdAt) return 1;
      
      // 2순위: 카테고리 인기도 (일부 카테고리 우선)
      const popularCategories = ['Trend', 'Tips', 'News'];
      const aIsPopular = popularCategories.includes(a.category);
      const bIsPopular = popularCategories.includes(b.category);
      if (aIsPopular && !bIsPopular) return -1;
      if (!aIsPopular && bIsPopular) return 1;
      
      return 0;
    }).slice(0, limit);
    
    // 언어별 번역 가져오기 헬퍼 함수
    const getTranslation = (translations: any, defaultValue: string): string => {
      if (!translations) return defaultValue;
      const langMap: { [key: string]: string } = {
        'ko': translations.ko,
        'en': translations.en,
        'ja': translations.ja,
        'th': translations.th,
        'zh': translations.zh,
      };
      return langMap[lang] || defaultValue;
    };
    
    // 데이터 가공 (참여 유지 요소 포함, 언어별 번역 적용)
    const formattedMagazines = sortedMagazines.map(magazine => {
      // 현재 언어에 맞는 번역 가져오기
      const title = getTranslation(magazine.titleTranslations, magazine.title);
      const description = getTranslation(magazine.descriptionTranslations, magazine.description);
      
      return {
        id: magazine._id.toString(),
        title: title,
        description: description,
        category: magazine.category,
        imageUrl: magazine.imageUrl,
        readTime: magazine.readTime || '5분 읽기',
        date: magazine.date || magazine.createdAt.toISOString().split('T')[0],
        content: magazine.content, // content는 원본 유지 (필요시 번역 추가 가능)
        createdAt: magazine.createdAt.toISOString(),
        // 참여 유지 요소
        isNew: (new Date().getTime() - magazine.createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000, // 7일 이내 = 신규
        isTrending: magazine.category === 'Trend', // 트렌드 카테고리 = 트렌딩
      };
    });
    
    return NextResponse.json({
      success: true,
      data: formattedMagazines,
      meta: {
        total: formattedMagazines.length,
        newCount: formattedMagazines.filter(m => m.isNew).length,
        trendingCount: formattedMagazines.filter(m => m.isTrending).length,
      },
    });
  } catch (error) {
    console.error('매거진 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '매거진 목록을 불러오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
