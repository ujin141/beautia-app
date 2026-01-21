import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';
import { withGetHandler } from '@/lib/api-handler';
import { withCache, createCacheKey } from '@/lib/cache';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';

export const runtime = 'nodejs';

/**
 * GET: 실시간 트래픽 통계 (시간대별 예약 수)
 */
async function handleGet(request: NextRequest) {
  await connectDB();

  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get('range') || '24h'; // 24h, 7d

  // 캐시 키 생성 (5분 TTL)
  const cacheKey = createCacheKey('admin:traffic', range, new Date().toISOString().split('T')[0]);
  
  return await withCache(cacheKey, async () => {
    const now = new Date();
    let startDate: Date;
    let interval: 'hour' | 'day';

    if (range === '24h') {
      // 최근 24시간 (시간별)
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      interval = 'hour';
    } else {
      // 최근 7일 (일별)
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      interval = 'day';
    }

    // 예약 데이터 조회
    const bookings = await Booking.find({
      createdAt: { $gte: startDate },
    }).select('createdAt').lean();

    // 시간대별/일별 집계
    const data: { [key: string]: number } = {};

    if (interval === 'hour') {
      // 24시간을 12개 구간으로 나눔 (2시간씩)
      for (let i = 0; i < 12; i++) {
        const hour = now.getHours() - (11 - i) * 2;
        const hourKey = hour < 0 ? hour + 24 : hour;
        data[`${hourKey.toString().padStart(2, '0')}:00`] = 0;
      }

      bookings.forEach(booking => {
        const bookingDate = new Date(booking.createdAt);
        const hour = bookingDate.getHours();
        // 2시간 단위로 그룹화
        const hourGroup = Math.floor(hour / 2) * 2;
        const key = `${hourGroup.toString().padStart(2, '0')}:00`;
        if (data[key] !== undefined) {
          data[key]++;
        }
      });
    } else {
      // 7일간 일별 집계
      for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        const dateKey = date.toISOString().split('T')[0];
        data[dateKey] = 0;
      }

      bookings.forEach(booking => {
        const bookingDate = new Date(booking.createdAt);
        const dateKey = bookingDate.toISOString().split('T')[0];
        if (data[dateKey] !== undefined) {
          data[dateKey]++;
        }
      });
    }

    // 배열로 변환
    const trafficData = Object.entries(data).map(([label, value]) => ({
      label,
      value,
    }));

    // 최대값 계산 (그래프 높이 정규화용)
    const maxValue = Math.max(...trafficData.map(d => d.value), 1);

    return {
      range,
      interval,
      data: trafficData,
      maxValue,
      total: bookings.length,
    };
  }, 5 * 60 * 1000); // 5분 캐시
}

export const GET = withAdminAuth(withGetHandler(handleGet));
