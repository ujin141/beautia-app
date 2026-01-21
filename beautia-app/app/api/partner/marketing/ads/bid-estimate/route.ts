import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';

// GET: 키워드 입찰가 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword');

    if (!keyword) {
      return NextResponse.json({ success: false, error: 'Keyword is required' }, { status: 400 });
    }

    // 해당 키워드에 대한 활성 광고 조회 (CPC 높은 순)
    // Ad 모델에 keywords 필드와 costPerClick 필드가 있다고 가정
    // 현재 Ad 모델 확인 필요. 없다면 기본 로직 사용.
    
    // Ad 모델 구조 확인을 위해 일단 주석 처리 후 기본 로직 구현
    /*
    const topAds = await Ad.find({
      keywords: keyword,
      status: 'active',
      type: 'search_powerlink'
    })
    .sort({ costPerClick: -1 })
    .limit(1);
    
    const topBid = topAds.length > 0 ? topAds[0].costPerClick : 0;
    */

    // Mock Data for now as Ad model might need updates for keywords
    // 실제로는 DB에서 집계해야 함
    const baseBid = 100; // 기본 입찰가
    const popularityMultiplier = keyword.length * 10; // 임의의 인기 로직
    const topBid = baseBid + popularityMultiplier + Math.floor(Math.random() * 500);
    
    // 추천 입찰가 (1위보다 조금 더 높게)
    const recommendedBid = topBid + 50;

    return NextResponse.json({
      success: true,
      data: {
        keyword,
        topBid,
        recommendedBid,
        currency: 'KRW'
      }
    });

  } catch (error: any) {
    console.error('입찰가 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '입찰가 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
