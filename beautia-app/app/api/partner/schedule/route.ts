import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Schedule from '@/models/Schedule';
import PartnerUser from '@/models/PartnerUser';

// GET: 스케줄 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const staffName = searchParams.get('staffName');

    if (!partnerId) {
      return NextResponse.json(
        { error: '파트너 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 파트너 존재 확인
    const partner = await PartnerUser.findById(partnerId);
    if (!partner) {
      return NextResponse.json(
        { error: '파트너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 쿼리 빌드
    const query: any = { partnerId };

    // 날짜 범위 필터
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // 직원 이름 필터
    if (staffName) {
      query.staffName = staffName;
    }

    const schedules = await Schedule.find(query)
      .sort({ date: 1, startTime: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error('스케줄 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 스케줄 추가
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { partnerId, staffId, staffName, date, startTime, endTime, breakStartTime, breakEndTime, notes } = body;

    if (!partnerId || !staffName || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다. (partnerId, staffName, date, startTime, endTime)' },
        { status: 400 }
      );
    }

    // 파트너 존재 확인
    const partner = await PartnerUser.findById(partnerId);
    if (!partner) {
      return NextResponse.json(
        { error: '파트너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 시간 유효성 검사
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    if (start >= end) {
      return NextResponse.json(
        { error: '종료 시간은 시작 시간보다 늦어야 합니다.' },
        { status: 400 }
      );
    }

    // 휴게 시간 유효성 검사
    if (breakStartTime && breakEndTime) {
      const breakStart = new Date(`2000-01-01T${breakStartTime}`);
      const breakEnd = new Date(`2000-01-01T${breakEndTime}`);
      if (breakStart >= breakEnd) {
        return NextResponse.json(
          { error: '휴게 종료 시간은 휴게 시작 시간보다 늦어야 합니다.' },
          { status: 400 }
        );
      }
      if (breakStart < start || breakEnd > end) {
        return NextResponse.json(
          { error: '휴게 시간은 근무 시간 내에 있어야 합니다.' },
          { status: 400 }
        );
      }
    }

    // 중복 스케줄 확인 (같은 직원, 같은 날짜, 시간 겹침)
    const existingSchedule = await Schedule.findOne({
      partnerId,
      staffName,
      date: new Date(date),
      $or: [
        {
          $and: [
            { startTime: { $lte: startTime } },
            { endTime: { $gt: startTime } },
          ],
        },
        {
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gte: endTime } },
          ],
        },
        {
          $and: [
            { startTime: { $gte: startTime } },
            { endTime: { $lte: endTime } },
          ],
        },
      ],
    });

    if (existingSchedule) {
      return NextResponse.json(
        { error: '해당 시간에 이미 근무 스케줄이 있습니다.' },
        { status: 400 }
      );
    }

    const schedule = new Schedule({
      partnerId,
      staffId: staffId || null,
      staffName,
      date: new Date(date),
      startTime,
      endTime,
      breakStartTime: breakStartTime || undefined,
      breakEndTime: breakEndTime || undefined,
      notes: notes || undefined,
    });

    await schedule.save();

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('스케줄 추가 오류:', error);
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: '입력한 정보가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 스케줄 수정
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { scheduleId, partnerId, staffName, date, startTime, endTime, breakStartTime, breakEndTime, notes } = body;

    if (!scheduleId || !partnerId) {
      return NextResponse.json(
        { error: '스케줄 ID와 파트너 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const schedule = await Schedule.findOne({ _id: scheduleId, partnerId });
    if (!schedule) {
      return NextResponse.json(
        { error: '스케줄을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 업데이트할 필드
    if (staffName) schedule.staffName = staffName;
    if (date) schedule.date = new Date(date);
    if (startTime) schedule.startTime = startTime;
    if (endTime) schedule.endTime = endTime;
    if (breakStartTime !== undefined) schedule.breakStartTime = breakStartTime || undefined;
    if (breakEndTime !== undefined) schedule.breakEndTime = breakEndTime || undefined;
    if (notes !== undefined) schedule.notes = notes || undefined;

    // 시간 유효성 검사
    const start = new Date(`2000-01-01T${schedule.startTime}`);
    const end = new Date(`2000-01-01T${schedule.endTime}`);
    if (start >= end) {
      return NextResponse.json(
        { error: '종료 시간은 시작 시간보다 늦어야 합니다.' },
        { status: 400 }
      );
    }

    // 중복 스케줄 확인 (자신 제외)
    const existingSchedule = await Schedule.findOne({
      _id: { $ne: scheduleId },
      partnerId,
      staffName: schedule.staffName,
      date: schedule.date,
      $or: [
        {
          $and: [
            { startTime: { $lte: schedule.startTime } },
            { endTime: { $gt: schedule.startTime } },
          ],
        },
        {
          $and: [
            { startTime: { $lt: schedule.endTime } },
            { endTime: { $gte: schedule.endTime } },
          ],
        },
        {
          $and: [
            { startTime: { $gte: schedule.startTime } },
            { endTime: { $lte: schedule.endTime } },
          ],
        },
      ],
    });

    if (existingSchedule) {
      return NextResponse.json(
        { error: '해당 시간에 이미 근무 스케줄이 있습니다.' },
        { status: 400 }
      );
    }

    await schedule.save();

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('스케줄 수정 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 스케줄 삭제
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const scheduleId = searchParams.get('scheduleId');
    const partnerId = searchParams.get('partnerId');

    if (!scheduleId || !partnerId) {
      return NextResponse.json(
        { error: '스케줄 ID와 파트너 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const schedule = await Schedule.findOneAndDelete({ _id: scheduleId, partnerId });
    if (!schedule) {
      return NextResponse.json(
        { error: '스케줄을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '스케줄이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('스케줄 삭제 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
