import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  fitbitId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    fitbitId: { type: String, sparse: true },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
  }
);

// 모델이 이미 컴파일되었는지 확인
const User = (mongoose.models.User || mongoose.model<IUser>('User', userSchema)) as Model<IUser>;

export default User;