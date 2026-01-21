import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';

export const runtime = 'nodejs';

/**
 * 디버깅용: 실제 Shop 데이터의 카테고리 확인
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 전체 매장 개수
    const totalShops = await Shop.countDocuments({});
    
    // 모든 카테고리 값 (중복 제거)
    const allCategories = await Shop.distinct('category');
    
    // 각 카테고리별 개수
    const categoryCounts: { [key: string]: number } = {};
    for (const cat of allCategories) {
      const count = await Shop.countDocuments({ category: cat });
      categoryCounts[cat] = count;
    }
    
    // 샘플 매장들 (최대 20개)
    const sampleShops = await Shop.find({})
      .limit(20)
      .select('name category')
      .lean();
    
    // 'Hair' 관련 검색 테스트
    const hairExact = await Shop.countDocuments({ category: 'Hair' });
    const hairLower = await Shop.countDocuments({ category: 'hair' });
    const hairRegex = await Shop.countDocuments({ category: new RegExp('^Hair$', 'i') });
    const hairOr = await Shop.countDocuments({
      $or: [
        { category: 'Hair' },
        { category: 'hair' },
        { category: 'HAIR' },
      ]
    });
    
    return NextResponse.json({
      success: true,
      data: {
        totalShops,
        allCategories,
        categoryCounts,
        sampleShops,
        hairTests: {
          exact: hairExact,
          lower: hairLower,
          regex: hairRegex,
          or: hairOr,
        },
      },
    });
  } catch (error) {
    console.error('디버깅 API 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '디버깅 정보를 가져오는 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
