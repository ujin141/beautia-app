import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Promotion from '@/models/Promotion';
import Shop from '@/models/Shop';
import { ObjectId } from 'mongodb';

// GET: 특정 프로모션 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 프로모션 ID입니다.' },
        { status: 400 }
      );
    }

    const promotion = await Promotion.findById(id).lean();

    if (!promotion) {
      return NextResponse.json(
        { error: '프로모션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...promotion,
        _id: promotion._id.toString(),
        shopId: promotion.shopId?.toString() || null,
      },
    });
  } catch (error) {
    console.error('프로모션 조회 오류:', error);
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

// PUT: 프로모션 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 프로모션 ID입니다.' },
        { status: 400 }
      );
    }

    const promotion = await Promotion.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    ).lean();

    if (!promotion) {
      return NextResponse.json(
        { error: '프로모션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '프로모션이 수정되었습니다.',
      data: {
        ...promotion,
        _id: promotion._id.toString(),
        shopId: promotion.shopId?.toString() || null,
      },
    });
  } catch (error) {
    console.error('프로모션 수정 오류:', error);
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

// DELETE: 프로모션 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 프로모션 ID입니다.' },
        { status: 400 }
      );
    }

    const promotion = await Promotion.findByIdAndDelete(id);

    if (!promotion) {
      return NextResponse.json(
        { error: '프로모션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '프로모션이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('프로모션 삭제 오류:', error);
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
