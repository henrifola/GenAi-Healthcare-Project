import mongoose from 'mongoose';

const stepCountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    steps: {
      type: Number,
      required: true,
      default: 0,
    },
    calories: {
      type: Number,
      required: true,
      default: 0,
    },
    distance: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// 사용자별 날짜 인덱스
stepCountSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.StepCount || mongoose.model('StepCount', stepCountSchema); 