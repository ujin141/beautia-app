import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import Settlement from '@/models/Settlement';
import PartnerUser from '@/models/PartnerUser';
import { verifyAdminAuth } from '@/lib/admin-auth';

// Stripe 초기화
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null as any;

// POST: 정산 지급 처리
async function handlePOST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { settlementId, notes } = body;

    if (!settlementId) {
      return NextResponse.json(
        { error: '정산 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe가 설정되지 않았습니다. STRIPE_SECRET_KEY를 확인해주세요.' },
        { status: 500 }
      );
    }

    const settlement = await Settlement.findById(settlementId);
    if (!settlement) {
      return NextResponse.json(
        { error: '정산 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (settlement.status !== 'pending') {
      return NextResponse.json(
        { error: `이미 처리된 정산입니다. (현재 상태: ${settlement.status})` },
        { status: 400 }
      );
    }

    // 파트너 정보 확인
    const partner = await PartnerUser.findById(settlement.partnerId);
    if (!partner) {
      return NextResponse.json(
        { error: '파트너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Stripe Connect 계정 필수 확인
    if (!partner.stripeConnectAccountId) {
      return NextResponse.json(
        { error: '파트너의 Stripe Connect 계정이 연결되지 않았습니다. 정산을 위해서는 Stripe Connect 계정이 필요합니다.' },
        { status: 400 }
      );
    }

    // Stripe Connect 계정 상태 확인
    let account;
    try {
      account = await stripe.accounts.retrieve(partner.stripeConnectAccountId);
      
      if (account.details_submitted === false || account.payouts_enabled === false) {
        return NextResponse.json(
          { error: '파트너의 Stripe Connect 계정이 아직 활성화되지 않았습니다. 파트너에게 온보딩을 완료하도록 안내해주세요.' },
          { status: 400 }
        );
      }
    } catch (accountError) {
      return NextResponse.json(
        { error: `Stripe Connect 계정 조회 실패: ${accountError instanceof Error ? accountError.message : '알 수 없는 오류'}` },
        { status: 500 }
      );
    }

    // 정산 상태를 처리중으로 변경
    settlement.status = 'processing';
    if (notes) {
      settlement.notes = notes;
    }
    await settlement.save();

    // Stripe Transfer 실행 (무조건 Stripe만 사용)
    try {
      // 통화 결정 (파트너 국가에 따라, 기본 USD)
      const currency = 'usd';

      // 정산 금액을 센트 단위로 변환
      const amountInCents = Math.round(settlement.payout * 100);

      // Stripe Transfer 생성
      const transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        destination: partner.stripeConnectAccountId,
        metadata: {
          settlementId: settlement._id.toString(),
          partnerId: settlement.partnerId,
          period: settlement.period,
          totalSales: settlement.totalSales.toString(),
          fee: settlement.fee.toString(),
          payout: settlement.payout.toString(),
        },
      });

      // 정산 정보 업데이트
      settlement.status = 'completed';
      settlement.transferInfo = {
        transferId: transfer.id,
        transferMethod: 'stripe',
        transferDate: new Date(),
      };
      await settlement.save();

      const transferResult = {
        success: true,
        message: `Stripe를 통해 ${currency.toUpperCase()} ${settlement.payout.toFixed(2)} 이체가 완료되었습니다.`,
        transferId: transfer.id,
      };

      return NextResponse.json({
        success: true,
        message: transferResult.message,
        data: {
          settlement: settlement.toObject(),
          transferResult,
        },
      });
    } catch (transferError) {
      // 이체 실패 시 상태를 실패로 변경
      settlement.status = 'failed';
      settlement.notes = `이체 실패: ${transferError instanceof Error ? transferError.message : '알 수 없는 오류'}`;
      await settlement.save();

      return NextResponse.json(
        { 
          error: '이체 처리 중 오류가 발생했습니다.',
          details: transferError instanceof Error ? transferError.message : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('정산 지급 처리 오류:', error);
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

// POST: 정산 지급 처리 (인증 확인 포함)
export async function POST(request: NextRequest) {
  // 인증 확인
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || '인증이 필요합니다.', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }
  
  return handlePOST(request);
}

// PATCH: 정산 상태 업데이트 (영수증 업로드 등)
async function handlePATCH(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { settlementId, status, receiptUrl, notes } = body;

    if (!settlementId) {
      return NextResponse.json(
        { error: '정산 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const settlement = await Settlement.findById(settlementId);
    if (!settlement) {
      return NextResponse.json(
        { error: '정산 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (status) {
      settlement.status = status;
    }
    if (receiptUrl && settlement.transferInfo) {
      settlement.transferInfo.receiptUrl = receiptUrl;
    }
    if (notes !== undefined) {
      settlement.notes = notes;
    }

    await settlement.save();

    return NextResponse.json({
      success: true,
      data: settlement.toObject(),
    });
  } catch (error) {
    console.error('정산 상태 업데이트 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 정산 상태 업데이트 (인증 확인 포함)
export async function PATCH(request: NextRequest) {
  // 인증 확인
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || '인증이 필요합니다.', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }
  
  return handlePATCH(request);
}
