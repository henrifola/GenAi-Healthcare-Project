import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    friendId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// 중복 친구 관계 방지를 위한 복합 인덱스
friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

export default mongoose.models.Friend || mongoose.model('Friend', friendSchema); 