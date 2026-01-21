// 어드민 광고 성과 조회 API
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import PartnerUser from '@/models/PartnerUser';
import Shop from '@/models/Shop';
import mongoose from 'mongoose';

// GET: 광고 성과 통계 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const adId = searchParams.get('adId'); // 개별 광고 ID
    const partnerId = searchParams.get('partnerId'); // 파트너별 필터
    const type = searchParams.get('type'); // 광고 타입 필터
    const dateRange = searchParams.get('dateRange') || '30d'; // 7d, 30d, 90d, all

    // 날짜 범위 계산
    let startDate: Date | null = null;
    if (dateRange !== 'all') {
      const days = parseInt(dateRange.replace('d', ''));
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    // 개별 광고 성과 조회
    if (adId) {
      const ad = await Ad.findById(adId)
        .populate('partnerId', 'name email')
        .populate('shopId', 'name category')
        .lean();

      if (!ad) {
        return NextResponse.json(
          { success: false, error: '광고를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // CTR, CPC 계산
      const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
      const cpc = ad.clicks > 0 ? (ad.cost / ad.clicks) : 0;
      const currentSpend = ad.cost; // 실제 지출 (클릭 기반 광고는 다를 수 있음)

      return NextResponse.json({
        success: true,
        data: {
          ad: {
            id: ad._id.toString(),
            type: ad.type,
            status: ad.status,
            startDate: ad.startDate,
            endDate: ad.endDate,
            cost: ad.cost,
            budget: ad.budget,
            dailyCost: ad.dailyCost,
            costPerClick: ad.costPerClick,
            costPerAction: ad.costPerAction,
            keywords: ad.keywords || [],
          },
          partner: ad.partnerId,
          shop: ad.shopId,
          performance: {
            impressions: ad.impressions || 0,
            clicks: ad.clicks || 0,
            ctr: Number(ctr.toFixed(2)),
            cpc: Number(cpc.toFixed(0)),
            totalSpend: currentSpend,
            remainingBudget: ad.budget ? ad.budget - currentSpend : 0,
          },
        },
      });
    }

    // 전체 성과 통계 조회
    const filter: any = {};
    if (partnerId) {
      filter.partnerId = new mongoose.Types.ObjectId(partnerId);
    }
    if (type) {
      filter.type = type;
    }
    if (startDate) {
      filter.createdAt = { $gte: startDate };
    }

    // 전체 광고 조회
    const ads = await Ad.find(filter)
      .populate('partnerId', 'name email')
      .populate('shopId', 'name category')
      .lean();

    // 통계 계산
    const totalAds = ads.length;
    const activeAds = ads.filter((ad: any) => ad.status === 'active').length;
    const totalImpressions = ads.reduce((sum: number, ad: any) => sum + (ad.impressions || 0), 0);
    const totalClicks = ads.reduce((sum: number, ad: any) => sum + (ad.clicks || 0), 0);
    const totalSpend = ads.reduce((sum: number, ad: any) => sum + (ad.cost || 0), 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

    // 타입별 통계
    const typeStats: { [key: string]: any } = {};
    ['main_banner', 'category_top', 'search_powerlink', 'local_push'].forEach((adType) => {
      const typeAds = ads.filter((ad: any) => ad.type === adType);
      const typeImpressions = typeAds.reduce((sum: number, ad: any) => sum + (ad.impressions || 0), 0);
      const typeClicks = typeAds.reduce((sum: number, ad: any) => sum + (ad.clicks || 0), 0);
      const typeSpend = typeAds.reduce((sum: number, ad: any) => sum + (ad.cost || 0), 0);
      const typeCTR = typeImpressions > 0 ? (typeClicks / typeImpressions) * 100 : 0;
      const typeCPC = typeClicks > 0 ? typeSpend / typeClicks : 0;

      typeStats[adType] = {
        count: typeAds.length,
        impressions: typeImpressions,
        clicks: typeClicks,
        spend: typeSpend,
        ctr: Number(typeCTR.toFixed(2)),
        cpc: Number(typeCPC.toFixed(0)),
      };
    });

    // 파트너별 상위 성과 (상위 10개)
    const partnerStatsMap: { [key: string]: any } = {};
    ads.forEach((ad: any) => {
      const partnerId = ad.partnerId?._id?.toString() || ad.partnerId?.toString() || 'unknown';
      if (!partnerStatsMap[partnerId]) {
        partnerStatsMap[partnerId] = {
          partnerId,
          partnerName: ad.partnerId?.name || ad.partnerId?.email || 'Unknown',
          ads: 0,
          impressions: 0,
          clicks: 0,
          spend: 0,
        };
      }
      partnerStatsMap[partnerId].ads += 1;
      partnerStatsMap[partnerId].impressions += ad.impressions || 0;
      partnerStatsMap[partnerId].clicks += ad.clicks || 0;
      partnerStatsMap[partnerId].spend += ad.cost || 0;
    });

    const topPartners = Object.values(partnerStatsMap)
      .map((stat: any) => ({
        ...stat,
        ctr: stat.impressions > 0 ? Number(((stat.clicks / stat.impressions) * 100).toFixed(2)) : 0,
        cpc: stat.clicks > 0 ? Number((stat.spend / stat.clicks).toFixed(0)) : 0,
      }))
      .sort((a: any, b: any) => b.spend - a.spend)
      .slice(0, 10);

    // 최근 성과가 좋은 광고 (상위 10개)
    const topAds = ads
      .map((ad: any) => {
        const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
        return {
          id: ad._id.toString(),
          type: ad.type,
          partnerName: ad.partnerId?.name || ad.partnerId?.email || 'Unknown',
          shopName: ad.shopId?.name || 'Unknown',
          impressions: ad.impressions || 0,
          clicks: ad.clicks || 0,
          ctr: Number(ctr.toFixed(2)),
          spend: ad.cost || 0,
          status: ad.status,
        };
      })
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalAds,
          activeAds,
          totalImpressions,
          totalClicks,
          totalSpend,
          avgCTR: Number(avgCTR.toFixed(2)),
          avgCPC: Number(avgCPC.toFixed(0)),
        },
        typeStats,
        topPartners,
        topAds,
      },
    });
  } catch (error: any) {
    console.error('광고 성과 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '광고 성과 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
