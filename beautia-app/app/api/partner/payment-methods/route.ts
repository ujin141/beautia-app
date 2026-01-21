import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import PartnerUser from '@/models/PartnerUser';
import { getPartnerUser } from '@/lib/auth';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY가 설정되지 않았습니다.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null as any;

// GET: 저장된 결제 수단 목록 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
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

    if (!partner.stripeCustomerId || !stripe) {
      return NextResponse.json({
        success: true,
        data: {
          paymentMethods: [],
          defaultPaymentMethod: null,
          hasStripeCustomer: false,
        },
      });
    }

    // Stripe에서 저장된 결제 수단 목록 조회
    const paymentMethods = await stripe.paymentMethods.list({
      customer: partner.stripeCustomerId,
      type: 'card',
    });

    const formattedMethods = paymentMethods.data.map((pm: any) => ({
      id: pm.id,
      type: pm.type,
      card: {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      },
      isDefault: pm.id === partner.defaultPaymentMethodId,
    }));

    return NextResponse.json({
      success: true,
      data: {
        paymentMethods: formattedMethods,
        defaultPaymentMethod: partner.defaultPaymentMethodId || null,
        hasStripeCustomer: true,
      },
    });
  } catch (error) {
    console.error('결제 수단 조회 오류:', error);
    return NextResponse.json(
      { error: '결제 수단 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 결제 수단 저장을 위한 Setup Intent 생성
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { partnerId } = body;

    if (!partnerId) {
      return NextResponse.json(
        { error: '파트너 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const partner = await PartnerUser.findById(partnerId);
    if (!partner) {
      return NextResponse.json(
        { error: '파트너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Stripe Customer가 없으면 생성
    let customerId = partner.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: partner.email,
        name: partner.name,
        metadata: {
          partnerId: partnerId,
        },
      });
      customerId = customer.id;
      
      // PartnerUser에 Customer ID 저장
      await PartnerUser.findByIdAndUpdate(partnerId, {
        stripeCustomerId: customerId,
      });
    }

    // Setup Intent 생성 (카드 저장용)
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    return NextResponse.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      customerId: customerId,
    });
  } catch (error) {
    console.error('Setup Intent 생성 오류:', error);
    return NextResponse.json(
      { error: '결제 수단 저장을 위한 설정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 기본 결제 수단 설정
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { partnerId, paymentMethodId } = body;

    if (!partnerId || !paymentMethodId) {
      return NextResponse.json(
        { error: '파트너 ID와 결제 수단 ID가 필요합니다.' },
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

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // Stripe Customer의 기본 결제 수단으로 설정
    await stripe.customers.update(partner.stripeCustomerId!, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // PartnerUser에도 저장
    await PartnerUser.findByIdAndUpdate(partnerId, {
      defaultPaymentMethodId: paymentMethodId,
    });

    return NextResponse.json({
      success: true,
      message: '기본 결제 수단이 설정되었습니다.',
    });
  } catch (error) {
    console.error('기본 결제 수단 설정 오류:', error);
    return NextResponse.json(
      { error: '기본 결제 수단 설정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 결제 수단 삭제
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');
    const paymentMethodId = searchParams.get('paymentMethodId');

    if (!partnerId || !paymentMethodId) {
      return NextResponse.json(
        { error: '파트너 ID와 결제 수단 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const partner = await PartnerUser.findById(partnerId);
    if (!partner) {
      return NextResponse.json(
        { error: '파트너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 기본 결제 수단이면 해제
    if (partner.defaultPaymentMethodId === paymentMethodId) {
      await PartnerUser.findByIdAndUpdate(partnerId, {
        $unset: { defaultPaymentMethodId: '' },
      });
    }

    // Stripe에서 결제 수단 제거
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({
      success: true,
      message: '결제 수단이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('결제 수단 삭제 오류:', error);
    return NextResponse.json(
      { error: '결제 수단 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
