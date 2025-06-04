import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface RankingUser {
  _id: string;
  name: string;
  email: string;
  image: string;
  totalSteps: number;
  avgSteps: number;
}

type Period = 'daily' | 'weekly' | 'monthly';

export default function StepsRanking() {
  const { data: session } = useSession();
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [period, setPeriod] = useState<Period>('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch(`/api/rankings/steps?period=${period}`);
        if (!response.ok) {
          throw new Error('랭킹을 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        setRankings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchRankings();
    }
  }, [session, period]);

  const periodLabels = {
    daily: '오늘',
    weekly: '이번 주',
    monthly: '이번 달',
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">걸음 수 랭킹</h2>
        <div className="flex space-x-2">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md ${
                period === p
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {rankings.map((user, index) => (
          <div
            key={user._id}
            className={`flex items-center p-4 bg-white rounded-lg shadow ${
              user._id === session?.user?.id ? 'border-2 border-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-center w-8 h-8 mr-4 text-lg font-bold">
              {index + 1}
            </div>
            <div className="relative w-12 h-12 mr-4">
              <Image
                src={user.image || '/default-avatar.png'}
                alt={user.name}
                fill
                className="rounded-full"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">
                {user.name}
                {user._id === session?.user?.id && ' (나)'}
              </h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">
                {user.totalSteps.toLocaleString()} 걸음
              </p>
              <p className="text-sm text-gray-500">
                평균: {Math.round(user.avgSteps).toLocaleString()} 걸음
              </p>
            </div>
          </div>
        ))}

        {rankings.length === 0 && (
          <p className="text-center text-gray-500">
            아직 기록된 걸음 수가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
} 