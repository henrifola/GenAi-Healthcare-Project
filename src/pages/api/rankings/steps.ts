import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import StepCount from '@/models/StepCount';
import { connectDB } from '@/lib/mongodb';
import { StepsRankingResponse } from '@/types/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StepsRankingResponse>
) {
  try {
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
      });
    }

    const { period = 'daily' } = req.query;
    if (!['daily', 'weekly', 'monthly'].includes(period as string)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period',
      });
    }

    await connectDB();

    const now = new Date();
    let startDate;

    switch (period) {
      case 'daily':
        startDate = startOfDay(now);
        break;
      case 'weekly':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // 월요일부터 시작
        break;
      case 'monthly':
        startDate = startOfMonth(now);
        break;
      default:
        startDate = startOfDay(now);
    }

    const rankings = await StepCount.aggregate([
      {
        $match: {
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalSteps: { $sum: '$steps' },
          totalCalories: { $sum: '$calories' },
          totalDistance: { $sum: '$distance' },
        },
      },
      {
        $sort: { totalSteps: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          _id: 1,
          userId: '$_id',
          steps: '$totalSteps',
          calories: '$totalCalories',
          distance: '$totalDistance',
          user: {
            _id: '$user._id',
            name: '$user.name',
            email: '$user.email',
            image: '$user.image',
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        rankings,
        period: period as 'daily' | 'weekly' | 'monthly',
      },
    });
  } catch (error) {
    console.error('Steps Ranking API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
} 