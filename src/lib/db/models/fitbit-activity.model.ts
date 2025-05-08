import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFitbitActivity extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // 'YYYY-MM-DD' 형식
  data: {
    summary?: any; // 일일 요약 데이터
    heart?: any; // 심박수 데이터
    sleep?: any; // 수면 데이터
    activities?: any[]; // 활동 목록
    hrv?: any; // 심박 변이도
  };
  createdAt: Date;
  updatedAt: Date;
}

const fitbitActivitySchema = new Schema<IFitbitActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD 형식
    data: {
      summary: { type: Schema.Types.Mixed },
      heart: { type: Schema.Types.Mixed },
      sleep: { type: Schema.Types.Mixed },
      activities: [{ type: Schema.Types.Mixed }],
      hrv: { type: Schema.Types.Mixed },
    },
  },
  {
    timestamps: true,
  }
);

// 복합 인덱스 생성: 사용자별 날짜 조회를 빠르게 하기 위함
fitbitActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

const FitbitActivity = (mongoose.models.FitbitActivity || 
  mongoose.model<IFitbitActivity>('FitbitActivity', fitbitActivitySchema)) as Model<IFitbitActivity>;

export default FitbitActivity;