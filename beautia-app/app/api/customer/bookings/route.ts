import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import CustomerUser from '@/models/CustomerUser';
import Shop from '@/models/Shop';
import { verifyCustomerToken } from '@/lib/customer-token-verifier';

export const runtime = 'nodejs';

// GET: 예약 목록 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 토큰 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const customer = await verifyCustomerToken(token);
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }
    
    const customerId = customer.id || customer._id?.toString();
    
    // 예약 목록 조회
    const bookings = await Booking.find({ userId: customerId })
      .sort({ createdAt: -1 }) // 최신순 정렬
      .lean();
      
    // 데이터 가공
    const formattedBookings = bookings.map((booking: any) => ({
      id: booking._id.toString(),
      userId: booking.userId,
      userName: booking.userName,
      shopId: booking.shopId,
      shopName: booking.shopName,
      serviceId: booking.serviceId,
      serviceName: booking.serviceName,
      date: booking.date,
      time: booking.time,
      price: booking.price,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentType: booking.paymentType,
      depositAmount: booking.depositAmount,
      remainingAmount: booking.remainingAmount,
      staffId: booking.staffId,
      staffName: booking.staffName,
      createdAt: booking.createdAt ? new Date(booking.createdAt).toISOString() : new Date().toISOString(),
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedBookings, // Flutter 앱에서 기대하는 형식
    });
  } catch (error) {
    console.error('예약 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '예약 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 예약 생성
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const customer = await verifyCustomerToken(token);
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      shopId, 
      serviceId, 
      date,
      paymentType,
      depositAmount,
      remainingAmount, 
      time, 
      price, 
      staffId, 
      staffName,
      couponId 
    } = body;

    // 필수 필드 검증
    if (!shopId || !serviceId || !date || !time || !price) {
      return NextResponse.json(
        { success: false, error: '모든 필수 정보를 입력해주세요.' },
        { status: 400 }
      );
    }

    const customerId = customer.id || customer._id?.toString();
    const customerUser = await CustomerUser.findById(customerId);
    if (!customerUser) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 매장 및 메뉴 정보 조회
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return NextResponse.json(
        { success: false, error: '매장을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const menu = shop.menus.find((m: any) => m.id === serviceId);
    if (!menu) {
      return NextResponse.json(
        { success: false, error: '서비스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 결제 상태 결정
    let finalPaymentStatus: 'paid' | 'deposit_paid' = 'paid';
    if (paymentType === 'deposit' || paymentType === 'direct') {
      finalPaymentStatus = 'deposit_paid'; // 보증금만 결제된 상태
    }

    // 예약 생성
    const newBooking = new Booking({
      userId: customerId,
      userName: customerUser.name,
      userPhone: customerUser.phone || '',
      shopId: shop._id.toString(),
      shopName: shop.name,
      partnerId: shop.partnerId.toString(),
      serviceId: menu.id,
      serviceName: menu.name,
      date,
      time,
      price,
      originalPrice: menu.price,
      status: 'confirmed', // 결제 완료 후 호출되므로 확정 상태로 생성
      paymentStatus: finalPaymentStatus,
      paymentType: paymentType || 'full',
      depositAmount: depositAmount,
      remainingAmount: remainingAmount,
      staffId: staffId,
      staffName: staffName,
      couponId: couponId,
    });

    await newBooking.save();

    const bookingObj = newBooking.toObject();
    return NextResponse.json({
      success: true,
      message: '예약이 완료되었습니다.',
      data: {
        id: bookingObj._id.toString(),
        userId: bookingObj.userId,
        userName: bookingObj.userName,
        shopId: bookingObj.shopId,
        shopName: bookingObj.shopName,
        serviceId: bookingObj.serviceId,
        serviceName: bookingObj.serviceName,
        date: bookingObj.date,
        time: bookingObj.time,
        price: bookingObj.price,
        status: bookingObj.status,
        paymentStatus: bookingObj.paymentStatus,
        paymentType: bookingObj.paymentType,
        depositAmount: bookingObj.depositAmount,
        remainingAmount: bookingObj.remainingAmount,
        staffId: bookingObj.staffId,
        staffName: bookingObj.staffName,
        createdAt: bookingObj.createdAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('예약 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '예약 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
