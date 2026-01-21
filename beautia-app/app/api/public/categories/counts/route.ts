import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';

export const runtime = 'nodejs';

/**
 * 카테고리별 매장 개수 조회 API
 * - 모든 카테고리 또는 특정 카테고리 목록의 매장 개수를 한 번에 반환
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const categoriesParam = searchParams.get('categories'); // 쉼표로 구분된 카테고리 ID 목록
    
    // 카테고리 목록 정의 (프론트엔드와 동일하게 유지)
    const allCategories = [
      'Hair',
      'Nail',
      'Skin',
      'Makeup',
      'Spa',
      'Massage',
      'Clinic',
      'Wedding',
      'Men',
      'Body',
      'Eyelash',
      'PersonalColor',
    ];
    
    // 요청된 카테고리 목록 또는 전체 카테고리
    let categories: string[] = [];
    if (categoriesParam) {
      categories = categoriesParam.split(',').map(c => c.trim()).filter(c => c.length > 0);
    } else {
      categories = allCategories;
    }
    
    console.log('요청된 카테고리 목록:', categories);
    
    // 각 카테고리별 매장 개수 조회
    const counts: { [key: string]: number } = {};
    
    // 각 카테고리별로 개수 조회 (대소문자 구분 없이)
    for (const category of categories) {
      try {
        // 방법 1: 정규식 사용 (대소문자 구분 없이)
        const regex = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const count1 = await Shop.countDocuments({ category: regex });
        
        // 방법 2: 대소문자 변환 후 직접 매칭 (폴백)
        const count2 = await Shop.countDocuments({
          $or: [
            { category: category },
            { category: category.toLowerCase() },
            { category: category.toUpperCase() },
            { category: category.charAt(0).toUpperCase() + category.slice(1).toLowerCase() },
          ]
        });
        
        // 더 큰 값을 사용 (정규식이 더 정확할 수 있음)
        const count = Math.max(count1, count2);
        counts[category] = count;
        console.log(`카테고리 ${category}: 정규식=${count1}개, OR조건=${count2}개, 최종=${count}개`);
        
        // 디버깅: 실제로 매칭되는 매장 확인
        if (count > 0) {
          const matchedShops = await Shop.find({ 
            $or: [
              { category: regex },
              { category: category },
              { category: category.toLowerCase() },
              { category: category.toUpperCase() },
            ]
          }).limit(3).select('name category').lean();
          console.log(`  매칭된 매장 샘플:`, matchedShops);
        } else {
          // 매칭되지 않을 때 실제 DB의 카테고리 값 확인
          const allShops = await Shop.find({}).limit(10).select('name category').lean();
          console.log(`  전체 매장 샘플 (카테고리 확인용):`, allShops);
        }
      } catch (error) {
        console.error(`카테고리 ${category} 개수 조회 오류:`, error);
        counts[category] = 0;
      }
    }
    
    console.log('카테고리 개수 조회 요청:', { categories, categoriesParam });
    console.log('최종 카운트 결과:', counts);
    
    // 실제 DB에 있는 모든 카테고리 확인 (디버깅용)
    const allCategoriesInDB = await Shop.distinct('category');
    console.log('DB에 실제 존재하는 카테고리:', allCategoriesInDB);
    
    // 전체 매장 개수 확인
    const totalShops = await Shop.countDocuments({});
    console.log('전체 매장 개수:', totalShops);
    
    // 샘플 매장의 카테고리 확인 (디버깅용)
    const sampleShops = await Shop.find({}).limit(5).select('name category').lean();
    console.log('샘플 매장 카테고리:', sampleShops);
    
    return NextResponse.json({
      success: true,
      data: counts,
      debug: {
        requestedCategories: categories,
        foundCategories: Object.keys(counts),
        allCategoriesInDB: allCategoriesInDB,
        totalShops: totalShops,
        sampleShops: sampleShops,
      },
    });
  } catch (error) {
    console.error('카테고리별 매장 개수 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '카테고리별 매장 개수를 조회하는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
