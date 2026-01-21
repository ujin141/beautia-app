import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import PartnerUser from '@/models/PartnerUser';
import { getPartnerUser } from '@/lib/auth';

// Stripe 초기화
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY가 설정되지 않았습니다.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null as any;

// POST: Stripe Connect 계정 생성 및 온보딩 링크 생성
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe가 설정되지 않았습니다. STRIPE_SECRET_KEY를 확인해주세요.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { partnerId } = body;

    if (!partnerId) {
      return NextResponse.json(
        { error: '파트너 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const partner = await PartnerUser.findById(partnerId);
    if (!partner) {
      return NextResponse.json(
        { error: '파트너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 Connect 계정이 있으면 기존 계정 사용
    if (partner.stripeConnectAccountId) {
      try {
        const account = await stripe.accounts.retrieve(partner.stripeConnectAccountId);
        
        // 온보딩 링크 생성
        const accountLink = await stripe.accountLinks.create({
          account: partner.stripeConnectAccountId,
          refresh_url: `${request.nextUrl.origin}/partner/dashboard?stripe_refresh=true`,
          return_url: `${request.nextUrl.origin}/partner/dashboard?stripe_success=true`,
          type: 'account_onboarding',
        });

        return NextResponse.json({
          success: true,
          data: {
            accountId: partner.stripeConnectAccountId,
            accountStatus: account.details_submitted ? 'enabled' : 'pending',
            onboardingUrl: accountLink.url,
          },
        });
      } catch (error) {
        console.error('기존 Connect 계정 조회 실패:', error);
        // 계정이 삭제되었거나 유효하지 않으면 새로 생성
      }
    }

    // 새 Connect 계정 생성
    const account = await stripe.accounts.create({
      type: 'express', // Express 계정 (간단한 온보딩)
      country: 'US', // 기본값, 파트너가 온보딩 중 변경 가능
      email: partner.email,
      capabilities: {
        transfers: { requested: true }, // 이체 기능 활성화
      },
      metadata: {
        partnerId: partnerId,
        partnerName: partner.name,
      },
    });

    // 온보딩 링크 생성
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${request.nextUrl.origin}/partner/dashboard?stripe_refresh=true`,
      return_url: `${request.nextUrl.origin}/partner/dashboard?stripe_success=true`,
      type: 'account_onboarding',
    });

    // 파트너 정보 업데이트
    partner.stripeConnectAccountId = account.id;
    partner.stripeConnectAccountStatus = 'pending';
    await partner.save();

    return NextResponse.json({
      success: true,
      data: {
        accountId: account.id,
        accountStatus: 'pending',
        onboardingUrl: accountLink.url,
      },
    });
  } catch (error) {
    console.error('Stripe Connect 계정 생성 오류:', error);
    
    let errorMessage = '서버 오류가 발생했습니다.';
    let errorDetails: any = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any;
      errorDetails = {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
      };
      errorMessage = stripeError.message || errorMessage;
    }
    
    return NextResponse.json(
      { 
        error: 'Stripe Connect 계정 생성에 실패했습니다.',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}

// GET: Stripe Connect 계정 상태 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');

    if (!partnerId) {
      return NextResponse.json(
        { error: '파트너 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const partner = await PartnerUser.findById(partnerId);
    if (!partner) {
      return NextResponse.json(
        { error: '파트너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (!partner.stripeConnectAccountId) {
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          accountId: null,
          accountStatus: null,
          email: null,
          country: null,
        },
      });
    }

    // Stripe 계정 정보 조회
    const account = await stripe.accounts.retrieve(partner.stripeConnectAccountId);
    
    // 계정 상태 업데이트
    let accountStatus: 'pending' | 'restricted' | 'enabled' | 'disabled' = 'pending';
    if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
      accountStatus = 'enabled';
    } else if (account.charges_enabled === false || account.payouts_enabled === false) {
      accountStatus = 'restricted';
    } else if (account.details_submitted === false) {
      accountStatus = 'pending';
    }

    // 파트너 정보 업데이트
    if (partner.stripeConnectAccountStatus !== accountStatus) {
      partner.stripeConnectAccountStatus = accountStatus;
      await partner.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        accountId: account.id,
        accountStatus,
        email: account.email,
        country: account.country,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      },
    });
  } catch (error) {
    console.error('Stripe Connect 계정 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
