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
      // JWT 디코딩 시도 - 안전하게 처리
      try {
        // 먼저 표준 JWT 토큰으로 디코딩 시도
        const decoded = jwtDecode<any>(sessionToken);
        return { 
          token: decoded.accessToken, 
          source: 'cookie',
          decoded
        };
      } catch (decodeError) {
        console.error('표준 JWT 디코딩 실패, 세션 쿠키로 처리 시도:', decodeError);
        
        // NextAuth의 암호화된 쿠키일 수 있으므로 세션 조회 방식으로 전환
        return { 
          token: null, 
          source: 'session',
          error: decodeError 
        };
      }
    } catch (e) {
      console.error('JWT 디코딩 오류:', e);
      return { token: null, source: null, error: e };
    }
  } catch (e) {
    console.error('토큰 추출 오류:', e);
    return { token: null, source: null, error: e };
  }
}

export async function GET(request: NextRequest) {
  try {
    let session: any = null;
    let accessToken: string | null = null;
    
    // 1. 커스텀 헤더 확인
    const fitbitToken = request.headers.get('x-fitbit-token');
    const authUser = request.headers.get('x-auth-user');
    
    if (fitbitToken) {
      // 커스텀 헤더에서 토큰을 받은 경우
      accessToken = fitbitToken;
      session = {
        accessToken: fitbitToken,
        provider: 'fitbit',
        user: {
          email: authUser || 'unknown@fitbit.user',
        }
      };
      console.log('커스텀 헤더에서 인증 정보 사용');
    } else {
      // 2. 쿠키에서 토큰 추출 시도
      const tokenInfo = await getTokenFromRequest(request);
      
      if (tokenInfo.token) {
        accessToken = tokenInfo.token;
        session = {
          accessToken: tokenInfo.token,
          provider: 'fitbit',
          user: tokenInfo.decoded?.user || { email: tokenInfo.decoded?.email || 'unknown@fitbit.user' }
        };
        console.log(`쿠키에서 토큰 추출 성공 (${tokenInfo.source})`);
      } else {
        // 3. 기존 NextAuth 세션 사용
        session = await getServerSession(nextAuthOptions);
      }
    }
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    
    // 요청 파라미터 가져오기
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate'); // YYYY-MM-DD 형식
    const endDate = searchParams.get('endDate'); // YYYY-MM-DD 형식
    const limit = parseInt(searchParams.get('limit') || '30');
    
    // MongoDB 연결
    await connectDB();
    
    // 사용자 이메일로 사용자 조회
    const userEmail = session.user?.email;
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 쿼리 필터 생성
    const filter: any = { userId: user._id };
    
    // 날짜 범위 필터 추가
    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.date = { $gte: startDate };
    } else if (endDate) {
      filter.date = { $lte: endDate };
    }
    
    // 데이터 조회 (최신순으로 정렬)
    const activities = await FitbitActivity.find(filter)
      .sort({ date: -1 })
      .limit(limit);
    
    // 응답 데이터 가공
    const result = activities.map(activity => ({
      id: activity._id,
      date: activity.date,
      steps: activity.data.summary?.steps || 0,
      calories: activity.data.summary?.caloriesOut || 0,
      activeMinutes: (activity.data.summary?.fairlyActiveMinutes || 0) + (activity.data.summary?.veryActiveMinutes || 0),
      restingHeartRate: activity.data.heart?.['activities-heart']?.[0]?.value?.restingHeartRate,
      sleepDuration: activity.data.sleep?.summary?.totalMinutesAsleep 
        ? Math.floor(activity.data.sleep.summary.totalMinutesAsleep / 60) + (activity.data.sleep.summary.totalMinutesAsleep % 60) / 100
        : null,
      sleepEfficiency: activity.data.sleep?.summary?.efficiency || null,
      createdAt: activity.createdAt
    }));
    
    // 유효한 데이터만 필터링 (4월 10일 이전의 가짜 데이터 제외)
    const validData = result.filter(item => {
      // 4월 10일 이전의 데이터이고 걸음 수가 0이며 칼로리가 1737인 가짜 데이터 필터링
      if (item.date < '2025-04-10' && item.steps === 0 && item.calories === 1737) {
        return false;
      }
      
      // 실제 활동 데이터가 있는지 확인
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
    console.error('히스토리 조회 오류:', error);
    return NextResponse.json(
      { error: '데이터 조회 실패', message: error.message }, 
      { status: 500 }
    );
  }
}