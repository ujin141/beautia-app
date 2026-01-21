import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule extends Document {
  partnerId: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId; // 직원 ID (선택적, 직원이 없으면 null)
  staffName: string; // 직원 이름
  date: Date; // 근무 날짜
  startTime: string; // 시작 시간 (HH:mm 형식)
  endTime: string; // 종료 시간 (HH:mm 형식)
  breakStartTime?: string; // 휴게 시작 시간 (선택적)
  breakEndTime?: string; // 휴게 종료 시간 (선택적)
  notes?: string; // 메모
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: 'PartnerUser',
      required: true,
      index: true,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'PartnerUser',
      index: true,
    },
    staffName: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, // HH:mm 형식 검증
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, // HH:mm 형식 검증
    },
    breakStartTime: {
      type: String,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    },
    breakEndTime: {
      type: String,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스: 파트너별 날짜별 조회 최적화
ScheduleSchema.index({ partnerId: 1, date: 1 });
ScheduleSchema.index({ partnerId: 1, date: 1, staffName: 1 });

const Schedule = mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', ScheduleSchema);

export default Schedule;
