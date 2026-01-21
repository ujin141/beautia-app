// 파트너 고객 정보 조회 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import CustomerUser from '@/models/CustomerUser';
import Shop from '@/models/Shop';
import { verifyPartnerToken } from '@/lib/partner-token-verifier';
import mongoose from 'mongoose';

// GET: 파트너의 고객 목록 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');
    const search = searchParams.get('search');

    // 인증 확인
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('partner_token')?.value;

    if (token) {
      const verification = await verifyPartnerToken(token);
      if (!verification.valid || !verification.partnerId) {
        return NextResponse.json(
          { success: false, error: '인증이 필요합니다.' },
          { status: 401 }
        );
      }
      // 토큰에서 가져온 partnerId 우선 사용
      const verifiedPartnerId = verification.partnerId.toString();
      if (partnerId && partnerId !== verifiedPartnerId) {
        return NextResponse.json(
          { success: false, error: '권한이 없습니다.' },
          { status: 403 }
        );
      }
    } else if (!partnerId) {
      return NextResponse.json(
        { success: false, error: '파트너 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const finalPartnerId = token ? (await verifyPartnerToken(token!)).partnerId?.toString() : partnerId;

    // 파트너의 샵 찾기
    const shops = await Shop.find({ partnerId: new mongoose.Types.ObjectId(finalPartnerId!) })
      .select('_id')
      .lean();

    if (shops.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const shopIds = shops.map((shop: any) => shop._id);

    // 예약 정보로 고객 통계 집계
    const bookings = await Booking.find({
      shopId: { $in: shopIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    // 고유한 userId 목록 추출 및 ObjectId 변환
    const uniqueUserIds = Array.from(new Set(bookings.map((b: any) => b.userId).filter(Boolean)));
    
    // ObjectId로 변환 가능한 userId만 필터링
    const validUserIds = uniqueUserIds
      .map(id => {
        try {
          // 이미 ObjectId인 경우
          if (mongoose.Types.ObjectId.isValid(id)) {
            return new mongoose.Types.ObjectId(id);
          }
          return null;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as mongoose.Types.ObjectId[];
    
    // CustomerUser 정보 일괄 조회
    const customerUsers = await CustomerUser.find({
      _id: { $in: validUserIds }
    })
      .select('_id name email phone profileImage')
      .lean();
    
    // userId -> CustomerUser 매핑 생성
    const customerUserMap = new Map(
      customerUsers.map((cu: any) => [cu._id.toString(), cu])
    );

    // 고객별로 집계
    const customerMap = new Map<string, {
      userId: string;
      userName: string;
      userEmail: string;
      userPhone: string;
      profileImage?: string;
      visits: number;
      lastVisit: string;
      totalSpent: number;
      bookings: any[];
    }>();

    bookings.forEach((booking: any) => {
      const userId = booking.userId?.toString();
      if (!userId) return;

      // CustomerUser에서 정보 가져오기, 없으면 Booking에 저장된 정보 사용
      const customerUser = customerUserMap.get(userId);
      const userName = customerUser?.name || booking.userName || 'Unknown';
      const userEmail = customerUser?.email || '';
      const userPhone = customerUser?.phone || booking.userPhone || '';
      const profileImage = customerUser?.profileImage || '';

      const customer = customerMap.get(userId) || {
        userId,
        userName,
        userEmail,
        userPhone,
        profileImage,
        visits: 0,
        lastVisit: '',
        totalSpent: 0,
        bookings: [] as any[],
      };

      customer.visits += 1;
      customer.totalSpent += booking.price || booking.totalAmount || 0;
      customer.bookings.push(booking);

      // 마지막 방문일 업데이트
      const bookingDate = new Date(booking.createdAt || booking.date);
      if (!customer.lastVisit || bookingDate > new Date(customer.lastVisit)) {
        customer.lastVisit = bookingDate.toISOString();
      }

      customerMap.set(userId, customer);
    });

    // 배열로 변환 및 정렬
    let customers = Array.from(customerMap.values())
      .map((customer) => ({
        userId: customer.userId,
        userName: customer.userName,
        userEmail: customer.userEmail,
        userPhone: customer.userPhone,
        profileImage: customer.profileImage,
        visits: customer.visits,
        lastVisit: customer.lastVisit
          ? new Date(customer.lastVisit).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
            })
          : '-',
        totalSpent: customer.totalSpent,
        bookingCount: customer.bookings.length,
      }))
      .sort((a, b) => {
        // 마지막 방문일 기준 내림차순
        const dateA = customerMap.get(a.userId)?.lastVisit || '';
        const dateB = customerMap.get(b.userId)?.lastVisit || '';
        return dateB.localeCompare(dateA);
      });

    // 검색 필터
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(
        (customer) =>
          customer.userName.toLowerCase().includes(searchLower) ||
          customer.userEmail.toLowerCase().includes(searchLower) ||
          customer.userPhone.includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: customers,
    });
  } catch (error: any) {
    console.error('고객 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '고객 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
