import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/lib/auth/nextAuthOptions';
import connectDB from '@/lib/db/mongoose';
import User from '@/lib/db/models/user.model';
import FitbitActivity from '@/lib/db/models/fitbit-activity.model';
import { Types } from 'mongoose';
import { jwtDecode } from 'jwt-decode';

// 세션 쿠키에서 JWT 토큰을 추출하는 함수
async function getTokenFromRequest(req: NextRequest) {
  try {
    // 헤더에서 커스텀 토큰 확인
    const fitbitToken = req.headers.get('x-fitbit-token');
    if (fitbitToken) {
      return { token: fitbitToken, source: 'header' };
    }

    // 쿠키에서 세션 토큰 확인
    const sessionToken = req.cookies.get('next-auth.session-token')?.value || 
                       req.cookies.get('__Secure-next-auth.session-token')?.value;
    
    if (!sessionToken) {
      return { token: null, source: null };
    }
    
    try {
      // JWT 디코딩 시도
      const decoded = jwtDecode<any>(sessionToken);
      return { 
        token: decoded.accessToken, 
        source: 'cookie',
        decoded
      };
    } catch (e) {
      return { token: null, source: null, error: e };
    }
  } catch (e) {
    return { token: null, source: null, error: e };
  }
}

export async function GET(request: NextRequest) {
  try {
    let session: any = null;
    
    // 1. 세션에서 인증 정보 가져오기
    const tokenInfo = await getTokenFromRequest(request);
    
    if (tokenInfo.token) {
      session = {
        accessToken: tokenInfo.token,
        user: tokenInfo.decoded?.user || { email: tokenInfo.decoded?.email || 'unknown@fitbit.user' }
      };
    } else {
      // 기본 세션 확인
      session = await getServerSession(nextAuthOptions);
    }
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    
    // 2. 요청 파라미터 가져오기
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Number(searchParams.get('limit')) || 30;
    
    if (!startDate || !endDate) {
      return NextResponse.json({ error: '시작일과 종료일이 필요합니다.' }, { status: 400 });
    }
    
    // 3. MongoDB 연결
    await connectDB();
    
    // 4. 사용자 이메일로 사용자 ID 조회
    const userEmail = session.user?.email || 'unknown@fitbit.user';
    
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 5. 활동 데이터 조회
    const activities = await FitbitActivity.find({
      userId: user._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 }).limit(limit);
    
    // 6. 응답 데이터 가공
    const result = activities.map(activity => ({
      id: activity._id,
      date: activity.date,
      steps: activity.data.summary?.steps || 0,
      calories: activity.data.summary?.caloriesOut || 0,
      distance: activity.data.summary?.distances?.[0]?.distance || 0,
      activeMinutes: (activity.data.summary?.fairlyActiveMinutes || 0) + (activity.data.summary?.veryActiveMinutes || 0),
      restingHeartRate: activity.data.heart?.['activities-heart']?.[0]?.value?.restingHeartRate,
      sleepDuration: activity.data.sleep?.summary?.totalMinutesAsleep 
        ? Math.floor(activity.data.sleep.summary.totalMinutesAsleep / 60) + activity.data.sleep.summary.totalMinutesAsleep % 60 / 100 
        : null,
      sleepEfficiency: activity.data.sleep?.summary?.efficiency || null,
      createdAt: activity.createdAt
    }));
    
    // 유효한 데이터만 필터링
    const validData = result.filter(item => {
      // 실제 활동 데이터가 있는지 확인 (걸음 수나 심박수 등이 있으면 유효한 데이터로 간주)
      return item.steps > 0 || item.activeMinutes > 0 || 
             item.restingHeartRate !== undefined || 
             item.sleepDuration !== undefined;
    });
    
    return NextResponse.json({
      success: true,
      count: validData.length,
      data: validData
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: '데이터 조회 실패', message: error.message }, 
      { status: 500 }
    );
  }
}