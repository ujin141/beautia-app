import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop';

/**
 * 카테고리 목록 및 각 카테고리별 매장 개수 조회 API
 * - 모든 카테고리 목록 반환
 * - 각 카테고리별 매장 개수 포함
 * - 인기 카테고리 정보 포함
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 모든 카테고리 정의 (프론트엔드와 동기화)
    const categories = [
      { id: 'Hair', name: '헤어', popular: true },
      { id: 'Nail', name: '네일', popular: true },
      { id: 'Skin', name: '피부', popular: true },
      { id: 'Makeup', name: '메이크업', popular: false },
      { id: 'Spa', name: '스파', popular: false },
      { id: 'Massage', name: '마사지', popular: false },
      { id: 'Clinic', name: '클리닉', popular: false },
      { id: 'Wedding', name: '웨딩', popular: true },
      { id: 'Men', name: '남성', popular: false },
      { id: 'Body', name: '바디케어', popular: false },
      { id: 'Eyelash', name: '속눈썹', popular: true },
      { id: 'PersonalColor', name: '퍼스널컬러', popular: false },
    ];
    
    // 각 카테고리별 매장 개수 조회 (대소문자 구분 없이)
    const categoryCounts = await Promise.all(
      categories.map(async (category) => {
        try {
          // 대소문자 구분 없이 검색
          const regex = new RegExp(`^${category.id}$`, 'i');
          const count = await Shop.countDocuments({
            category: regex
          });
          return {
            id: category.id,
            name: category.name,
            count: count || 0,
            popular: category.popular || false,
          };
        } catch (error) {
          console.error(`카테고리 ${category.id} 개수 조회 오류:`, error);
          return {
            id: category.id,
            name: category.name,
            count: 0,
            popular: category.popular || false,
          };
        }
      })
    );
    
    // 총 매장 개수
    const totalShops = await Shop.countDocuments({});
    
    // 인기 카테고리 개수
    const popularCategories = categoryCounts.filter(c => c.popular);
    
    return NextResponse.json({
      success: true,
      data: categoryCounts,
      meta: {
        total: categoryCounts.length,
        popular: popularCategories.length,
        totalShops: totalShops,
      },
    });
  } catch (error) {
    console.error('카테고리 목록 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '카테고리 목록을 불러오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
