import { IFriend, IStepCount, IUser } from './models';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FriendsResponse extends ApiResponse<{
  friends: (IFriend & { friend: IUser })[];
}> {}

export interface FriendRequestResponse extends ApiResponse<{
  friend: IFriend;
}> {}

export interface StepsRankingResponse extends ApiResponse<{
  rankings: (IStepCount & { user: IUser })[];
  period: 'daily' | 'weekly' | 'monthly';
}> {} 