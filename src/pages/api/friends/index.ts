import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import Friend from '@/models/Friend';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';
import { FriendsResponse, FriendRequestResponse } from '@/types/api';
import { IFriend, IUser } from '@/types/models';
import { Types } from 'mongoose';

type ResponseType = FriendsResponse | FriendRequestResponse;

interface PopulatedFriend {
  _id: Types.ObjectId;
  userId: IUser & { _id: Types.ObjectId };
  friendId: IUser & { _id: Types.ObjectId };
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

interface FormattedFriend extends Omit<IFriend, 'userId' | 'friendId'> {
  userId: Types.ObjectId;
  friendId: Types.ObjectId;
  friend: IUser;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseType>
) {
  try {
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    await connectDB();

    if (req.method === 'GET') {
      const friendsQuery = await Friend.find({
        $or: [
          { userId: new Types.ObjectId(session.user.id), status: 'accepted' },
          { friendId: new Types.ObjectId(session.user.id), status: 'accepted' },
        ],
      })
      .populate<PopulatedFriend>('userId friendId', 'name email image')
      .lean();

      // 타입 단언을 사용하여 mongoose의 타입 문제 해결
      const friends = friendsQuery as unknown as PopulatedFriend[];

      const formattedFriends = friends.map(friend => ({
        _id: friend._id,
        userId: friend.userId._id,
        friendId: friend.friendId._id,
        status: friend.status,
        createdAt: friend.createdAt,
        updatedAt: friend.updatedAt,
        friend: friend.userId._id.toString() === session.user.id
          ? {
              _id: friend.friendId._id,
              name: friend.friendId.name,
              email: friend.friendId.email,
              image: friend.friendId.image,
            }
          : {
              _id: friend.userId._id,
              name: friend.userId.name,
              email: friend.userId.email,
              image: friend.userId.image,
            },
      })) as FormattedFriend[];

      return res.status(200).json({
        success: true,
        data: {
          friends: formattedFriends,
        },
      });
    }

    if (req.method === 'POST') {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required',
        });
      }

      // 사용자 검색
      const targetUser = await User.findOne({ email }).lean() as IUser | null;
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // 자기 자신에게 친구 요청을 보내는 것을 방지
      if (targetUser._id.toString() === session.user.id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot send friend request to yourself',
        });
      }

      // 이미 존재하는 친구 관계 확인
      const existingFriend = await Friend.findOne({
        $or: [
          { userId: new Types.ObjectId(session.user.id), friendId: targetUser._id },
          { userId: targetUser._id, friendId: new Types.ObjectId(session.user.id) },
        ],
      }).lean() as IFriend | null;

      if (existingFriend) {
        return res.status(400).json({
          success: false,
          error: 'Friend request already exists',
        });
      }

      const friend = await Friend.create({
        userId: new Types.ObjectId(session.user.id),
        friendId: targetUser._id,
        status: 'pending',
      });

      const newFriend = friend.toObject() as IFriend;

      return res.status(201).json({
        success: true,
        data: { friend: newFriend },
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  } catch (error) {
    console.error('Friends API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
} 