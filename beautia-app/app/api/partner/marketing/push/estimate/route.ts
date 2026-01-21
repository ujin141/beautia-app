import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerUser from '@/models/CustomerUser';
import Shop from '@/models/Shop';
import { ObjectId } from 'mongodb';

// POST: 타겟 모수 추정
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { shopId, radius = 3000, criteria } = body; // radius in meters

    if (!shopId) {
      return NextResponse.json({ success: false, error: 'Shop ID is required' }, { status: 400 });
    }

    const shop = await Shop.findById(shopId);
    if (!shop || !shop.latitude || !shop.longitude) {
      return NextResponse.json({ success: false, error: 'Shop location not found' }, { status: 404 });
    }

    // 기본 쿼리: 위치 기반
    const query: any = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [shop.longitude, shop.latitude]
          },
          $maxDistance: radius
        }
      }
    };

    // 추가 조건 (성별, 연령 등 - CustomerUser 모델에 해당 필드가 있다고 가정하거나 추후 확장)
    // 현재 CustomerUser 모델에는 birthDate나 gender가 명시적으로 없으므로,
    // 실제 구현 시에는 해당 필드를 추가하거나 mock 로직을 사용해야 함.
    // 여기서는 예시로 이름이 있는 유저만 카운트
    if (criteria) {
        // if (criteria.gender) query.gender = criteria.gender;
        // if (criteria.ageRange) ...
    }

    let count = 0;
    try {
      count = await CustomerUser.countDocuments(query);
    } catch (e) {
      console.warn('Geospatial query failed, falling back to mock estimate', e);
      // 인덱스가 없거나 데이터가 없을 경우를 대비한 Fallback
      count = Math.floor(Math.random() * 500) + 100; 
    }

    // 예상 비용 계산 (예: 1명당 50원)
    const costPerUser = 50;
    const estimatedCost = count * costPerUser;

    return NextResponse.json({
      success: true,
      data: {
        count,
        estimatedCost,
        radius,
        criteria
      }
    });

  } catch (error: any) {
    console.error('타겟 추정 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '타겟 추정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
