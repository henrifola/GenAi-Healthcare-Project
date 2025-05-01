import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/lib/auth/nextAuthOptions';
import connectDB from '@/lib/db/mongoose';
import User from '@/lib/db/models/user.model';
import { addDays, format, subMonths } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    // 로그인 정보 확인
    const session: any = await getServerSession(nextAuthOptions);
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    
    if (!session.accessToken) {
      return NextResponse.json({ error: 'Fitbit 액세스 토큰이 없습니다.' }, { status: 403 });
    }
    
    // 요청 본문 파싱
    const body = await request.json();
    const { months = 1 } = body;
    
    // 유효한 개월 수인지 확인
    if (![1, 2, 6, 12].includes(months)) {
      return NextResponse.json({ error: '유효한 개월 수가 아닙니다. 1, 2, 6, 12 중 하나를 선택하세요.' }, { status: 400 });
    }

    // MongoDB 연결
    await connectDB();
    
    // 사용자 조회
    const userEmail = session.user?.email;
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 시작 및 종료 날짜 계산
    const endDate = new Date();
    const startDate = subMonths(endDate, months);
    
    // 날짜 범위 생성 (하루 단위)
    const dateRange = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dateRange.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = addDays(currentDate, 1);
    }
    
    // 각 날짜별로 데이터 가져오기 및 저장 (최대 5개의 요청을 병렬로 처리)
    const batchSize = 5; // Fitbit API 속도 제한 때문에 더 작은 배치 사이즈로 설정
    const results = { 
      totalDays: dateRange.length, 
      processed: 0, 
      succeeded: 0, 
      failed: 0,
      errors: [] 
    };
    
    for (let i = 0; i < dateRange.length; i += batchSize) {
      const batch = dateRange.slice(i, i + batchSize);
      const batchPromises = batch.map(async (date) => {
        try {
          // 직접 Fitbit 사용자 데이터 API 엔드포인트 호출
          // const apiUrl = new URL(`/api/fitbit/user-data`, process.env.NEXTAUTH_URL);
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
          if (!process.env.NEXTAUTH_URL) {
            console.warn('Warning: NEXTAUTH_URL is not defined. Using fallback value "http://localhost:3000".');
          }
          const apiUrl = new URL(`/api/fitbit/user-data`, baseUrl);
          apiUrl.searchParams.append('date', date);
          apiUrl.searchParams.append('type', 'all');

          const response = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
              // 세션 쿠키 대신 액세스 토큰을 직접 사용하는 커스텀 헤더
              'x-fitbit-token': session.accessToken,
              'x-auth-user': userEmail || '',
            },
          });
          
          if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
          }
          
          results.succeeded++;
          return { date, success: true };
        } catch (error: any) {
          results.failed++;
          results.errors.push({ date, error: error.message });
          return { date, success: false, error: error.message };
        } finally {
          results.processed++;
        }
      });
      
      // 현재 배치의 모든 요청 완료 대기
      await Promise.allSettled(batchPromises);
      
      // Fitbit API 속도 제한 방지를 위한 지연 추가
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return NextResponse.json({
      success: true,
      message: `${months}개월 치 데이터 처리 완료`,
      results
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: '데이터 사전 로드 실패', message: error.message }, 
      { status: 500 }
    );
  }
}