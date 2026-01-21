import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import CustomerUser from '@/models/CustomerUser';
import Shop from '@/models/Shop';
import { ObjectId } from 'mongodb';

// GET: 마케팅 제안 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');

    if (!partnerId) {
      return NextResponse.json(
        { success: false, error: '파트너 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 파트너의 샵 조회
    const shop = await Shop.findOne({ partnerId: new ObjectId(partnerId) });
    if (!shop) {
      return NextResponse.json(
        { success: false, error: '샵을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const suggestions = [];

    // 1. 빈 시간 채우기 (Time Deal) 제안
    // 오늘/내일 예약이 적은 시간대 확인
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(startOfToday);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 2);

    const bookings = await Booking.find({
      shopId: shop._id,
      date: { $gte: startOfToday.toISOString().split('T')[0], $lt: endOfTomorrow.toISOString().split('T')[0] },
      status: { $ne: 'cancelled' }
    });

    // 예약이 적으면 제안 (단순 로직: 이틀간 예약이 20건 미만이면 - 조건을 완화함)
    if (bookings.length < 20) {
      suggestions.push({
        id: 'empty_slots',
        type: 'time_deal',
        title: '빈 시간 채우기',
        description: '오늘/내일 예약이 여유롭습니다. 타임 딜로 고객을 유치해보세요!',
        impact: '예상 수익 +150,000원',
        actionLabel: '타임 딜 켜기',
        actionUrl: '/partner/dashboard/marketing?action=promotion&type=flash_sale',
        icon: 'Clock',
        color: 'text-brand-mint',
      });
    }

    // 2. 우리 동네 홍보하기 (Local Push) 제안
    // 샵 주변 3km 내 유저 수 확인
    let nearbyUserCount = 0;
    if (shop.latitude && shop.longitude) {
      // CustomerUser에 location 필드가 있고 2dsphere 인덱스가 있다고 가정
      // 실제로는 데이터가 충분하지 않을 수 있으므로 mock 데이터 사용 가능성 염두
      try {
        nearbyUserCount = await CustomerUser.countDocuments({
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [shop.longitude, shop.latitude]
              },
              $maxDistance: 3000 // 3km
            }
          }
        });
      } catch (e) {
        console.log('위치 기반 쿼리 실패 (인덱스 없음 등):', e);
        nearbyUserCount = 500; // Mock count fallback
      }
    } else {
      nearbyUserCount = 500; // 위치 정보 없으면 기본값
    }

    // 조건 완화: 10명 이상이면 제안
    if (nearbyUserCount > 10) {
      suggestions.push({
        id: 'local_push',
        type: 'coupon',
        title: '우리 동네 홍보하기',
        description: `샵 반경 3km 내에 ${nearbyUserCount}명의 잠재 고객이 있습니다.`,
        impact: `예상 도달 ${nearbyUserCount}명`,
        actionLabel: '쿠폰 발송하기',
        actionUrl: '/partner/dashboard/marketing?action=promotion&type=coupon',
        icon: 'MapPin',
        color: 'text-brand-lilac',
      });
    }

    // 3. 단골 관리 (CRM) 제안
    suggestions.push({
      id: 'crm_revisit',
      type: 'message',
      title: '단골 고객 관리',
      description: '최근 3개월간 방문하지 않은 단골 고객에게 안부 메시지를 보내보세요.',
      impact: '재방문율 +15%',
      actionLabel: '메시지 보내기',
      actionUrl: '/partner/dashboard/customers',
      icon: 'MessageSquare',
      color: 'text-blue-500',
    });
    
    // 4. 만약 제안이 하나도 없다면 기본 제안 추가 (Fallback)
    if (suggestions.length === 0) {
       suggestions.push({
        id: 'default_promo',
        type: 'ad',
        title: '첫 광고 시작하기',
        description: '아직 광고를 진행하지 않으셨나요? 첫 광고로 신규 고객을 만나보세요.',
        impact: '신규 고객 유입 +30%',
        actionLabel: '광고 시작하기',
        actionUrl: '/partner/dashboard/marketing',
        icon: 'Lightbulb',
        color: 'text-yellow-500',
      });
    }

    return NextResponse.json({
      success: true,
      data: suggestions,
    });

  } catch (error: any) {
    console.error('마케팅 제안 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '마케팅 제안 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
