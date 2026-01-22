// 플랫폼 수익 조회 API (관리자용)
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withGetHandler } from '@/lib/api-handler';
import { withAdminAuth } from '@/lib/admin-auth';
import { successResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response';
import connectDB from '@/lib/mongodb';
import PlatformRevenue from '@/models/PlatformRevenue';
import { ObjectId } from 'mongodb';

async function handleGet(request: NextRequest) {
  await connectDB();

  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type'); // marketing_charge, marketing_ad, booking_commission, subscription
    const partnerId = searchParams.get('partnerId');

    // 쿼리 구성
    const query: any = {
      status: 'completed', // 완료된 거래만
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    if (type) {
      query.type = type;
    }

    if (partnerId) {
      query.partnerId = new ObjectId(partnerId);
    }

    // 수익 조회
    const revenues = await PlatformRevenue.find(query)
      .sort({ createdAt: -1 })
      .populate('partnerId', 'name email')
      .populate('shopId', 'name')
      .lean();

    // 통계 계산
    const totalRevenue = revenues.reduce((sum, r: any) => sum + (r.amount || 0), 0);
    const revenueByType = revenues.reduce((acc: any, r: any) => {
      const type = r.type || 'unknown';
      acc[type] = (acc[type] || 0) + (r.amount || 0);
      return acc;
    }, {});

    const revenueByMonth = revenues.reduce((acc: any, r: any) => {
      const date = new Date(r.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + (r.amount || 0);
      return acc;
    }, {});

    return successResponse({
      revenues: revenues.map((r: any) => ({
        id: r._id.toString(),
        type: r.type,
        partnerId: r.partnerId?._id?.toString(),
        partnerName: r.partnerId?.name,
        partnerEmail: r.partnerId?.email,
        shopId: r.shopId?._id?.toString(),
        shopName: r.shopId?.name,
        amount: r.amount,
        originalAmount: r.originalAmount,
        commissionRate: r.commissionRate,
        currency: r.currency,
        description: r.description,
        createdAt: r.createdAt,
      })),
      summary: {
        totalRevenue,
        revenueByType,
        revenueByMonth,
        count: revenues.length,
      },
    });
  } catch (error) {
    console.error('수익 조회 오류:', error);
    return serverErrorResponse(error as Error, '수익 조회 중 오류가 발생했습니다.');
  }
}

export const GET = withAdminAuth(withGetHandler(handleGet));
