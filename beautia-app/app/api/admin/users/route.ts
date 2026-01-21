import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerUser from '@/models/CustomerUser';
import Booking from '@/models/Booking';

// GET: 모든 사용자 목록 조회 (어드민용)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // 필터 조건 구성
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    let users = await CustomerUser.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // 검색 필터 적용
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter((u: any) => 
        u.name?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        u.phone?.includes(search)
      );
    }

    // 각 사용자의 예약 횟수 조회
    const usersWithStats = await Promise.all(
      users.map(async (user: any) => {
        const bookingCount = await Booking.countDocuments({ userId: user._id.toString() });
        const lastBooking = await Booking.findOne({ userId: user._id.toString() })
          .sort({ createdAt: -1 })
          .lean();

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          joinDate: user.joinDate.toISOString().split('T')[0],
          lastLoginAt: user.lastLoginAt?.toISOString().split('T')[0],
          status: user.status || 'active',
          bookingCount,
          lastBookingDate: lastBooking ? new Date(lastBooking.createdAt).toLocaleDateString('ko-KR') : '-',
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: usersWithStats,
      count: usersWithStats.length,
    });
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// PATCH: 사용자 상태 변경
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { error: '사용자 ID와 상태가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!['active', 'banned', 'withdrawal'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }

    const user = await CustomerUser.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '사용자 상태가 변경되었습니다.',
      data: {
        id: user._id.toString(),
        status: user.status,
      },
    });
  } catch (error) {
    console.error('사용자 상태 변경 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
