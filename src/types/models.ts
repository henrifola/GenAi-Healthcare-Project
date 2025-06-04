import { Types } from 'mongoose';

export interface IFriend {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  friendId: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface IStepCount {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date;
  steps: number;
  calories: number;
  distance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  name: string;
  image?: string;
} 