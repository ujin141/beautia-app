import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settlement from '@/models/Settlement';
import PartnerUser from '@/models/PartnerUser';
import Stripe from 'stripe';
import { verifyAdminAuth } from '@/lib/admin-auth';

// Stripe 초기화
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null as any;

// PATCH: 정산 상태 업데이트 (processing 시 Stripe로 자동 이체)
async function handlePATCH(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await connectDB();
    
    const settlementId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'processing', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: '유효한 상태를 입력해주세요.' },
        { status: 400 }
      );
    }

    const settlement = await Settlement.findById(settlementId);
    if (!settlement) {
      return NextResponse.json(
        { error: '정산을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // processing 상태로 변경 시 Stripe로 자동 이체
    if (status === 'processing' && settlement.status === 'pending') {
      // 파트너 정보 조회
      const partner = await PartnerUser.findById(settlement.partnerId);
      if (!partner) {
        return NextResponse.json(
          { error: '파트너를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // Stripe Connect 계정 확인
      if (!stripe) {
        settlement.status = 'failed';
        settlement.notes = 'Stripe가 설정되지 않았습니다.';
        await settlement.save();
        return NextResponse.json(
          { error: 'Stripe가 설정되지 않았습니다. STRIPE_SECRET_KEY를 확인해주세요.' },
          { status: 500 }
        );
      }

      if (!partner.stripeConnectAccountId) {
        settlement.status = 'failed';
        settlement.notes = '파트너의 Stripe Connect 계정이 연결되지 않았습니다.';
        await settlement.save();
        return NextResponse.json(
          { error: '파트너의 Stripe Connect 계정이 연결되지 않았습니다.' },
          { status: 400 }
        );
      }

      // Stripe Connect 계정 상태 확인
      try {
        const account = await stripe.accounts.retrieve(partner.stripeConnectAccountId);
        
        if (account.details_submitted === false || account.payouts_enabled === false) {
          settlement.status = 'failed';
          settlement.notes = `Stripe Connect 계정이 활성화되지 않았습니다. (상태: ${account.details_submitted ? '정보 미제출' : '지급 미활성화'})`;
          await settlement.save();
          return NextResponse.json(
            { error: '파트너의 Stripe Connect 계정이 아직 활성화되지 않았습니다. 파트너에게 온보딩을 완료하도록 안내해주세요.' },
            { status: 400 }
          );
        }
      } catch (accountError) {
        settlement.status = 'failed';
        settlement.notes = `Stripe 계정 조회 실패: ${accountError instanceof Error ? accountError.message : '알 수 없는 오류'}`;
        await settlement.save();
        return NextResponse.json(
          { error: 'Stripe Connect 계정 조회에 실패했습니다.' },
          { status: 500 }
        );
      }

      // Stripe Transfer 실행
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

        // 정산 정보 업데이트 (completed로 변경)
        settlement.status = 'completed';
        settlement.transferInfo = {
          transferId: transfer.id,
          transferMethod: 'stripe',
          transferDate: new Date(),
        };
        await settlement.save();

        return NextResponse.json({
          success: true,
          message: `Stripe를 통해 ${currency.toUpperCase()} ${settlement.payout.toFixed(2)} 정산이 완료되었습니다.`,
          data: {
            _id: settlement._id.toString(),
            status: settlement.status,
            transferId: transfer.id,
          },
        });
      } catch (transferError) {
        // 이체 실패 시 상태를 failed로 변경
        settlement.status = 'failed';
        settlement.notes = `Stripe 이체 실패: ${transferError instanceof Error ? transferError.message : '알 수 없는 오류'}`;
        await settlement.save();

        return NextResponse.json(
          { 
            error: 'Stripe 이체 처리 중 오류가 발생했습니다.',
            details: transferError instanceof Error ? transferError.message : undefined
          },
          { status: 500 }
        );
      }
    }

    // 그 외 상태 변경 (completed, failed 등)
    const updatedSettlement = await Settlement.findByIdAndUpdate(
      settlementId,
      { status },
      { new: true }
    );

    if (!updatedSettlement) {
      return NextResponse.json(
        { error: '정산을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '정산 상태가 변경되었습니다.',
      data: {
        _id: updatedSettlement._id.toString(),
        status: updatedSettlement.status,
      },
    });
  } catch (error) {
    console.error('정산 상태 업데이트 오류:', error);
    return NextResponse.json(
      { 
        error: '정산 상태 업데이트에 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : '알 수 없는 오류') : undefined
      },
      { status: 500 }
    );
  }
}

// PATCH: 정산 상태 업데이트 (인증 확인 포함)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  
  // 인증 확인
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || '인증이 필요합니다.', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }
  
  return handlePATCH(request, resolvedParams);
}
