import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import Friend from '@/models/Friend';
import { connectDB } from '@/lib/mongodb';
import { FriendRequestResponse } from '@/types/api';
import { IFriend } from '@/types/models';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FriendRequestResponse>
) {
  try {
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid friend request ID',
      });
    }

    await connectDB();

    if (req.method === 'PUT') {
      const { action } = req.body;
      if (!action || (action !== 'accept' && action !== 'reject')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
        });
      }

      const friendRequest = await Friend.findOne({
        _id: id,
        friendId: session.user.id,
        status: 'pending',
      }).lean();

      if (!friendRequest) {
        return res.status(404).json({
          success: false,
          error: 'Friend request not found',
        });
      }

      const updatedFriend = await Friend.findByIdAndUpdate(
        id,
        { status: action },
        { new: true, lean: true }
      ) as IFriend;

      return res.status(200).json({
        success: true,
        data: { friend: updatedFriend },
      });
    }

    if (req.method === 'DELETE') {
      const friend = await Friend.findOneAndDelete({
        _id: id,
        $or: [
          { userId: session.user.id },
          { friendId: session.user.id },
        ],
      }).lean() as IFriend | null;

      if (!friend) {
        return res.status(404).json({
          success: false,
          error: 'Friend relationship not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: { friend },
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