import { NextRequest } from 'next/server';
import { withGetHandler, withPostHandler } from '@/lib/api-handler';
import { withIpRateLimit } from '@/lib/rate-limiter';
import { successResponse, validationErrorResponse } from '@/lib/api-response';
import { validateRequestBody, required } from '@/lib/api-validator';
import Booking from '@/models/Booking';
import CustomerCoupon from '@/models/CustomerCoupon';

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     tags: [Booking]
 *     summary: 예약 생성
 *     description: 새로운 예약을 생성합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userName
 *               - userPhone
 *               - shopId
 *               - shopName
 *               - partnerId
 *               - serviceId
 *               - serviceName
 *               - date
 *               - time
 *               - price
 *             properties:
 *               userId:
 *                 type: string
 *               userName:
 *                 type: string
 *               userPhone:
 *                 type: string
 *               shopId:
 *                 type: string
 *               shopName:
 *                 type: string
 *               partnerId:
 *                 type: string
 *               serviceId:
 *                 type: string
 *               serviceName:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: 예약 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *   get:
 *     tags: [Booking]
 *     summary: 예약 목록 조회
 *     description: 예약 목록을 조회합니다. userId, partnerId, status로 필터링 가능합니다.
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: 고객 ID
 *       - in: query
 *         name: partnerId
 *         schema:
 *           type: string
 *         description: 파트너 ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *         description: 예약 상태
 *     responses:
 *       200:
 *         description: 예약 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 */
// POST: 예약 생성
async function handlePost(request: NextRequest) {
  const body = await request.json();
  const { userId, userName, userPhone, shopId, shopName, partnerId, serviceId, serviceName, date, time, price, couponId, staffId, staffName, paymentType, depositAmount, remainingAmount } = body;

  // 필수 필드 검증
  const validation = validateRequestBody(body, [
    required('userId', '사용자 ID가 필요합니다.'),
    required('userName', '사용자 이름이 필요합니다.'),
    required('userPhone', '사용자 전화번호가 필요합니다.'),
    required('shopId', '매장 ID가 필요합니다.'),
    required('shopName', '매장 이름이 필요합니다.'),
    required('partnerId', '파트너 ID가 필요합니다.'),
    required('serviceId', '서비스 ID가 필요합니다.'),
    required('serviceName', '서비스 이름이 필요합니다.'),
    required('date', '예약 날짜가 필요합니다.'),
    required('time', '예약 시간이 필요합니다.'),
    required('price', '가격이 필요합니다.'),
  ]);

  if (!validation.valid) {
    return validationErrorResponse(validation.error!, validation.details);
  }

  // 예약 시간 중복 체크
  try {
    const existingBookingFilter: any = {
      shopId: shopId,
      date: date,
      time: time,
      status: { $in: ['pending', 'confirmed'] }, // 취소되지 않은 예약만 체크
    };

    // 스태프가 지정된 경우, 같은 스태프의 예약만 체크
    // 스태프가 없는 경우, 매장 전체 예약 체크
    if (staffId) {
      existingBookingFilter.staffId = staffId;
    }

    const existingBooking = await Booking.findOne(existingBookingFilter);

    if (existingBooking) {
      return validationErrorResponse(
        staffId 
          ? '해당 시간에 이미 예약이 있습니다. 다른 시간을 선택해주세요.' 
          : '해당 시간에 이미 예약이 있습니다. 다른 시간을 선택해주세요.'
      );
    }
  } catch (error) {
    console.error('예약 중복 체크 오류:', error);
    // 중복 체크 실패 시에도 예약 생성은 진행 (로깅만)
  }

  // 쿠폰 처리
  let finalPrice = price;
  let couponDiscount = 0;
  
  if (couponId) {
    try {
      const customerCoupon = await CustomerCoupon.findById(couponId);
      
      if (!customerCoupon) {
        return validationErrorResponse('유효하지 않은 쿠폰입니다.');
      }
      
      if (customerCoupon.userId !== userId) {
        return validationErrorResponse('본인의 쿠폰만 사용할 수 있습니다.');
      }
      
      if (customerCoupon.isUsed) {
        return validationErrorResponse('이미 사용된 쿠폰입니다.');
      }
      
      const now = new Date();
      if (customerCoupon.expiresAt < now) {
        return validationErrorResponse('만료된 쿠폰입니다.');
      }
      
      // 최소 구매 금액 확인
      if (customerCoupon.minPurchaseAmount && price < customerCoupon.minPurchaseAmount) {
        return validationErrorResponse(`최소 ${customerCoupon.minPurchaseAmount}원 이상 구매해야 합니다.`);
      }
      
      // 할인 금액 계산
      if (customerCoupon.discountType === 'percentage') {
        couponDiscount = Math.round(price * customerCoupon.discountValue / 100);
        if (customerCoupon.maxDiscountAmount && couponDiscount > customerCoupon.maxDiscountAmount) {
          couponDiscount = customerCoupon.maxDiscountAmount;
        }
      } else {
        couponDiscount = customerCoupon.discountValue;
      }
      
      finalPrice = price - couponDiscount;
      if (finalPrice < 0) finalPrice = 0;
      
      // 쿠폰 사용 처리
      customerCoupon.isUsed = true;
      customerCoupon.usedAt = now;
      customerCoupon.bookingId = undefined; // 예약 생성 후 업데이트
      await customerCoupon.save();
    } catch (error) {
      console.error('쿠폰 처리 오류:', error);
      return validationErrorResponse('쿠폰 처리 중 오류가 발생했습니다.');
    }
  }

  // 새 예약 생성
  const booking = new Booking({
    userId,
    userName,
    userPhone,
    shopId,
    shopName,
    partnerId,
    serviceId,
    serviceName,
    staffId: staffId || undefined,
    staffName: staffName || undefined,
    date,
    time,
    price: finalPrice, // 할인 적용된 최종 금액
    originalPrice: price, // 원래 금액
    couponId: couponId || undefined,
    couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentType: paymentType || 'full',
    depositAmount: depositAmount,
    remainingAmount: remainingAmount,
  });

  await booking.save();

  // 쿠폰에 예약 ID 저장
  if (couponId) {
    try {
      const customerCoupon = await CustomerCoupon.findById(couponId);
      if (customerCoupon) {
        customerCoupon.bookingId = booking._id.toString();
        await customerCoupon.save();
      }
    } catch (error) {
      console.error('쿠폰 예약 ID 저장 오류:', error);
      // 예약은 이미 생성되었으므로 계속 진행
    }
  }

  return successResponse(
    {
      id: booking._id.toString(),
      ...booking.toObject(),
      _id: undefined,
    },
    '예약이 생성되었습니다.',
    201
  );
}

// GET: 예약 목록 조회
async function handleGet(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId'); // 고객 ID
  const partnerId = searchParams.get('partnerId'); // 파트너 ID
  const status = searchParams.get('status'); // 상태 필터

  // 필터 조건 구성
  const filter: any = {};
  if (userId) {
    filter.userId = userId;
  }
  if (partnerId) {
    filter.partnerId = partnerId;
  }
  if (status) {
    filter.status = status;
  }

  const bookings = await Booking.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  // _id를 id로 변환
  const formattedBookings = bookings.map((booking: any) => ({
    id: booking._id.toString(),
    ...booking,
    _id: undefined,
    __v: undefined,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  }));

  return {
    bookings: formattedBookings,
    count: formattedBookings.length,
  };
}

export const GET = withGetHandler(handleGet);
// 예약 생성 API는 레이트 리미팅 적용 (15분에 20회)
export const POST = withIpRateLimit(withPostHandler(handlePost), 20, 15 * 60 * 1000);
