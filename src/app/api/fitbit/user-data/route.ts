import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/lib/auth/nextAuthOptions';

// Fitbit API 기본 URL (버전 1로 고정)
const FITBIT_API_URL = 'https://api.fitbit.com/1';

// API 요청에 대한 지연 시간을 추가하는 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 서버 측에서 Fitbit API 호출하는 함수
async function fetchFitbitDataFromServer(url: string, accessToken: string, retryCount = 0, maxRetries = 3) {
  try {
    // 재시도 시 지연 시간 추가 (지수 백오프)
    if (retryCount > 0) {
      const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000); // 최대 10초 지연
      console.log(`재시도 ${retryCount}/${maxRetries}, ${delayMs}ms 후 다시 시도...`);
      await delay(delayMs);
    }

    console.log(`Fitbit API 요청: ${FITBIT_API_URL}${url}`);
    
    // 전체 URL 로깅
    const fullUrl = `${FITBIT_API_URL}${url}`;
    console.log('전체 URL:', fullUrl);
    
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept-Language': 'ko_KR',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    };
    
    console.log('요청 헤더:', {
      ...headers,
      'Authorization': 'Bearer [MASKED]' // 실제 토큰은 로그에 표시하지 않음
    });
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    console.log('API 응답 상태:', response.status, response.statusText);

    // 응답 본문 텍스트 가져오기
    let responseText;
    try {
      responseText = await response.text();
      console.log('응답 본문 미리보기:', responseText.substring(0, 100));
    } catch (e) {
      console.error('응답 본문을 가져오는데 실패:', e);
      responseText = '';
    }

    // 429 Too Many Requests 오류 처리
    if (response.status === 429 && retryCount < maxRetries) {
      console.log('API 호출 한도 초과. 잠시 후 재시도합니다.');
      return await fetchFitbitDataFromServer(url, accessToken, retryCount + 1, maxRetries);
    }

    if (!response.ok) {
      console.error('Fitbit API 응답 오류:', {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
        body: responseText.substring(0, 200) // 응답 본문 일부만 로깅
      });
      
      // 오류 응답이 JSON인 경우 자세한 오류 정보 파싱 시도
      let errorDetail = '';
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.errors && errorJson.errors.length > 0) {
          errorDetail = ` - ${errorJson.errors.map((e: any) => e.message || e.errorType).join(', ')}`;
        } else if (errorJson.error) {
          errorDetail = ` - ${errorJson.error.message || errorJson.error.status || JSON.stringify(errorJson.error)}`;
        }
      } catch (e) {
        // JSON 파싱 실패 시 무시
      }

      // 429 오류에 대한 더 구체적인 메시지
      if (response.status === 429) {
        throw new Error(`Fitbit API 요청 한도 초과. 잠시 후 다시 시도해주세요. (429 Too Many Requests)${errorDetail}`);
      }
      
      throw new Error(`Fitbit API 오류: ${response.status} ${response.statusText}${errorDetail}`);
    }

    // 성공 응답 처리
    if (!responseText) {
      console.log('응답 본문이 비어있음');
      return {};
    }

    // JSON 파싱 시도
    try {
      return JSON.parse(responseText);
    } catch (error) {
      console.error('JSON 파싱 오류:', error, '원본 텍스트:', responseText.substring(0, 100));
      throw new Error('응답을 JSON으로 파싱할 수 없습니다.');
    }
  } catch (error) {
    console.error('Fitbit API 요청 실패:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // 로그인 정보 확인
    const session: any = await getServerSession(nextAuthOptions);
    
    if (!session) {
      console.log('세션 없음');
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    
    // 세션 정보 확인 (보안을 위해 토큰은 일부만 표시)
    console.log('세션 정보:', {
      hasSession: !!session,
      provider: session.provider,
      hasAccessToken: !!session.accessToken,
      tokenLength: session.accessToken ? session.accessToken.length : 0
    });
    
    // 토큰 검증
    if (!session.accessToken) {
      console.log('액세스 토큰 없음');
      return NextResponse.json({ error: 'Fitbit 액세스 토큰이 없습니다.' }, { status: 403 });
    }
    
    if (session.provider !== 'fitbit') {
      console.log('Fitbit 제공자 아님:', session.provider);
      return NextResponse.json({ error: 'Fitbit 인증이 필요합니다.' }, { status: 403 });
    }
    
    // 요청 파라미터 가져오기
    const searchParams = request.nextUrl.searchParams;
    const dataType = searchParams.get('type') || 'all'; // 기본값을 'all'로 변경
    let date = searchParams.get('date') || 'today';
    
    // 'today'인 경우 실제 오늘 날짜로 변환 (YYYY-MM-DD 형식)
    if (date === 'today') {
      const today = new Date();
      date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      console.log(`'today'를 실제 날짜로 변환: ${date}`);
    }
    
    let data = {};
    const accessToken = session.accessToken;
    
    // 개별 데이터 요청으로 변경
    console.log(`데이터 타입: ${dataType}, 날짜: ${date} 요청`);
    
    try {
      // 오류 식별을 위해 하나의 요청만 처리
      switch (dataType) {
        case 'profile':
          // 프로필 정보만 요청
          data = await fetchFitbitDataFromServer('/user/-/profile.json', accessToken);
          break;
          
        case 'activity':
          const activityData = await fetchFitbitDataFromServer(`/user/-/activities/date/${date}.json`, accessToken);
          console.log('활동 데이터 구조:', JSON.stringify(activityData).substring(0, 300) + '...');
          
          // 필수 필드 확인
          if (!activityData || !activityData.summary) {
            console.warn('활동 데이터에 summary 필드가 없습니다:', activityData);
          } else {
            // 필요한 필드가 있는지 확인
            const requiredFields = ['steps', 'caloriesOut', 'fairlyActiveMinutes', 'veryActiveMinutes'];
            const missingFields = requiredFields.filter(field => activityData.summary[field] === undefined);
            
            if (missingFields.length > 0) {
              console.warn(`활동 데이터에 일부 필드가 누락되었습니다: ${missingFields.join(', ')}`);
            }
          }
          
          data = activityData;
          break;
          
        case 'sleep':
          data = await fetchFitbitDataFromServer(`/user/-/sleep/date/${date}.json`, accessToken);
          break;
          
        case 'heart':
          data = await fetchFitbitDataFromServer(`/user/-/activities/heart/date/${date}/1d.json`, accessToken);
          break;
          
        case 'all':
          // 여러 요청으로 나누고 각각 충분한 지연 시간 추가
          try {
            // 먼저 프로필 정보 요청
            const profile = await fetchFitbitDataFromServer('/user/-/profile.json', accessToken);
            data = { profile };
            
            // 프로필 요청 후 1초 지연
            await delay(1000);
            
            try {
              // 활동 데이터 요청
              const activity = await fetchFitbitDataFromServer(`/user/-/activities/date/${date}.json`, accessToken);
              console.log('활동 데이터 구조:', JSON.stringify(activity).substring(0, 300) + '...');
              
              // 필수 필드 확인
              if (!activity || !activity.summary) {
                console.warn('활동 데이터에 summary 필드가 없습니다:', activity);
              } else {
                // 필요한 필드가 있는지 확인
                const requiredFields = ['steps', 'caloriesOut', 'fairlyActiveMinutes', 'veryActiveMinutes'];
                const missingFields = requiredFields.filter(field => activity.summary[field] === undefined);
                
                if (missingFields.length > 0) {
                  console.warn(`활동 데이터에 일부 필드가 누락되었습니다: ${missingFields.join(', ')}`);
                }
              }
              
              data = { ...data, activity };
              await delay(1000); // 다음 요청 전 1초 지연
            } catch (e: any) {
              console.log(`활동 데이터 가져오기 실패: ${e.message}, 계속 진행`);
            }
            
            try {
              // 수면 데이터 요청
              const sleep = await fetchFitbitDataFromServer(`/user/-/sleep/date/${date}.json`, accessToken);
              data = { ...data, sleep };
              await delay(1000); // 다음 요청 전 1초 지연
            } catch (e: any) {
              console.log(`수면 데이터 가져오기 실패: ${e.message}, 계속 진행`);
            }
            
            try {
              // 심박수 데이터 요청
              const heart = await fetchFitbitDataFromServer(`/user/-/activities/heart/date/${date}/1d.json`, accessToken);
              data = { ...data, heart };
            } catch (e: any) {
              console.log(`심박수 데이터 가져오기 실패: ${e.message}, 계속 진행`);
            }
            
          } catch (e) {
            console.error('모든 데이터 가져오기 실패, 가능한 데이터 반환:', e);
            // 부분적으로라도 성공한 데이터가 있으면 반환
            if (Object.keys(data).length === 0) {
              throw e; // 아무 데이터도 없으면 오류 발생
            }
          }
          break;
          
        default:
          return NextResponse.json({ error: '유효하지 않은 데이터 타입입니다.' }, { status: 400 });
      }
      
      console.log('데이터 가져오기 성공:', Object.keys(data));
      return NextResponse.json(data);
      
    } catch (error: any) {
      console.error(`${dataType} 데이터 요청 실패:`, error);
      
      // 429 오류인 경우 사용자 친화적인 메시지 반환
      let status = 500;
      let message = error.message || '데이터를 가져오는데 실패했습니다';
      
      if (message.includes('429') || message.includes('Too Many Requests')) {
        status = 429;
        message = 'Fitbit API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      // 오류 응답 개선
      return NextResponse.json({
        error: '데이터 가져오기 실패', 
        message: message,
        dataType: dataType,
        // 디버깅용 정보 추가
        debug: {
          provider: session.provider,
          hasToken: !!session.accessToken,
          tokenLength: session.accessToken?.length
        }
      }, { status });
    }
    
  } catch (error: any) {
    console.error('API 핸들러 오류:', error);
    return NextResponse.json(
      { error: '서버 오류', message: error.message },
      { status: 500 }
    );
  }
}