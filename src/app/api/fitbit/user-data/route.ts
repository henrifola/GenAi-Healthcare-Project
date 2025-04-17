import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/lib/auth/nextAuthOptions';
import connectDB from '@/lib/db/mongoose';
import User from '@/lib/db/models/user.model';
import FitbitActivity from '@/lib/db/models/fitbit-activity.model';
import mongoose from 'mongoose';
import { jwtDecode } from 'jwt-decode';

// Fitbit API 기본 URL (버전 1로 고정)
const FITBIT_API_URL = 'https://api.fitbit.com/1';

// API 요청에 대한 지연 시간을 추가하는 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 간단한 인메모리 캐시 구현
interface CacheItem {
  data: any;
  timestamp: number;
}

const cache: Record<string, CacheItem> = {};
const CACHE_TTL = 5 * 60 * 1000; // 캐시 유효시간: 5분

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
    
    // JWT 검증을 시도하기 전에 기본 형식 검사
    // JWT는 header.payload.signature 형식이어야 함
    if (!sessionToken.includes('.') || sessionToken.split('.').length !== 3) {
      console.log('세션 토큰이 JWT 형식이 아님, 세션 조회로 전환');
      return { token: null, source: 'session' };
    }
    
    try {
      const decoded = jwtDecode<any>(sessionToken);
      // 디코딩은 성공했지만 accessToken이 없는 경우
      if (!decoded.accessToken) {
        console.log('JWT에서 accessToken을 찾을 수 없음, 세션 조회로 전환');
        return { token: null, source: 'session' };
      }
      
      return { 
        token: decoded.accessToken, 
        source: 'cookie',
        decoded
      };
    } catch (e) {
      console.log('표준 JWT 디코딩 실패, 세션 조회로 전환:', e.message);
      return { token: null, source: 'session', error: e };
    }
  } catch (e) {
    console.log('토큰 추출 오류:', e.message);
    return { token: null, source: null, error: e };
  }
}

// 캐시에서 데이터 가져오기
function getCachedData(cacheKey: string): any | null {
  const cachedItem = cache[cacheKey];
  if (!cachedItem) return null;
  
  const now = Date.now();
  if (now - cachedItem.timestamp > CACHE_TTL) {
    // 캐시 만료
    delete cache[cacheKey];
    return null;
  }
  
  return cachedItem.data;
}

// 캐시에 데이터 저장
function setCacheData(cacheKey: string, data: any): void {
  cache[cacheKey] = {
    data,
    timestamp: Date.now()
  };
}

// 서버 측에서 Fitbit API 호출하는 함수
async function fetchFitbitDataFromServer(url: string, accessToken: string, retryCount = 0, maxRetries = 3) {
  // 캐시 키 생성
  const cacheKey = `${url}_${accessToken.substring(0, 10)}`;
  
  // 캐시 확인
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    console.log(`캐시에서 데이터 반환: ${url}`);
    return cachedData;
  }
  
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
      const data = JSON.parse(responseText);
      
      // 성공한 응답 캐시에 저장
      setCacheData(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('JSON 파싱 오류:', error, '원본 텍스트:', responseText.substring(0, 100));
      throw new Error('응답을 JSON으로 파싱할 수 없습니다.');
    }
  } catch (error) {
    console.error('Fitbit API 요청 실패:', error);
    throw error;
  }
}

// MongoDB에 사용자 및 Fitbit 데이터 저장하는 함수
async function saveUserDataToDb(session: any, date: string, fitbitData: any) {
  try {
    await connectDB();
    
    // 이메일로 사용자 조회 또는 생성
    const userEmail = session.user?.email || `${session.fitbitId || 'unknown'}@fitbit.user`;
    
    let user = await User.findOne({ email: userEmail });
    
    // 사용자가 없으면 새로 생성
    if (!user) {
      user = await User.create({
        name: session.user?.name || 'Fitbit User',
        email: userEmail,
        image: session.user?.image,
        fitbitId: session.fitbitId || session.user?.id,
      });
      console.log('새 사용자 생성됨:', user._id);
    }
    
    // Fitbit 활동 데이터 저장 또는 업데이트
    const activityData = {
      userId: user._id,
      date: date,
      data: {
        summary: fitbitData.activity?.summary || null,
        heart: fitbitData.heart || null,
        sleep: fitbitData.sleep || null,
        hrv: fitbitData.hrv || null,
        activities: fitbitData.activity?.activities || [],
      }
    };
    
    // upsert: true - 데이터가 없으면 생성, 있으면 업데이트
    await FitbitActivity.findOneAndUpdate(
      { userId: user._id, date: date },
      activityData,
      { upsert: true, new: true }
    );
    
    console.log('Fitbit 데이터 저장 완료:', date);
    return true;
  } catch (error) {
    console.error('MongoDB 저장 오류:', error);
    return false;
  }
}

// 진행 중인 요청 추적을 위한 객체
const pendingRequests: Record<string, Promise<any>> = {};

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
          user: tokenInfo.decoded || { email: 'unknown@fitbit.user' }
        };
        console.log(`쿠키에서 토큰 추출 성공 (${tokenInfo.source})`);
      } else {
        // 3. 기존 NextAuth 세션 사용
        session = await getServerSession(nextAuthOptions);
        
        if (session) {
          accessToken = session.accessToken;
        }
      }
    }
    
    // 세션 정보 확인
    console.log('세션 정보:', {
      hasSession: !!session,
      provider: session?.provider,
      hasAccessToken: !!accessToken,
      tokenLength: accessToken ? accessToken.length : 0
    });
    
    // 토큰 검증
    if (!accessToken) {
      console.log('액세스 토큰 없음');
      return NextResponse.json({ error: 'Fitbit 액세스 토큰이 없습니다. 재로그인이 필요합니다.' }, { status: 403 });
    }
    
    if (!session) {
      console.log('세션 없음');
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    
    // 요청 파라미터 가져오기
    const searchParams = request.nextUrl.searchParams;
    const dataType = searchParams.get('type') || 'all';
    let date = searchParams.get('date') || 'today';
    
    // 'today'인 경우 실제 오늘 날짜로 변환 (YYYY-MM-DD 형식)
    if (date === 'today') {
      const today = new Date();
      date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      console.log(`'today'를 실제 날짜로 변환: ${date}`);
    }
    
    // 요청 키 생성 (중복 요청 방지)
    const requestKey = `${dataType}_${date}_${accessToken.substring(0, 10)}`;
    
    // 이미 진행 중인 동일한 요청이 있는지 확인
    if (pendingRequests[requestKey]) {
      console.log('이미 진행 중인 동일한 요청이 있습니다. 해당 요청 결과를 기다립니다.');
      try {
        // 기존 요청의 결과를 기다림
        const data = await pendingRequests[requestKey];
        return NextResponse.json(data);
      } catch (error: any) {
        console.error('기존 요청에서 오류 발생:', error);
        return NextResponse.json(
          { error: '데이터 가져오기 실패', message: error.message },
          { status: 500 }
        );
      }
    }
    
    let data = {};
    
    // 각 데이터 타입에 따라 요청 처리 (Promise 생성)
    const fetchDataPromise = (async () => {
      try {
        switch (dataType) {
          case 'profile':
            data = await fetchFitbitDataFromServer('/user/-/profile.json', accessToken);
            break;
            
          case 'activity':
            const activityData = await fetchFitbitDataFromServer(`/user/-/activities/date/${date}.json`, accessToken);
            console.log('활동 데이터 구조:', JSON.stringify(activityData).substring(0, 300) + '...');
            data = activityData;
            break;
            
          case 'sleep':
            data = await fetchFitbitDataFromServer(`/user/-/sleep/date/${date}.json`, accessToken);
            break;
            
          case 'heart':
            data = await fetchFitbitDataFromServer(`/user/-/activities/heart/date/${date}/1d.json`, accessToken);
            break;
            
          case 'all':
            // Promise.all을 사용하여 여러 요청을 병렬로 처리
            try {
              const [profile, activity, sleep, heart] = await Promise.all([
                fetchFitbitDataFromServer('/user/-/profile.json', accessToken),
                fetchFitbitDataFromServer(`/user/-/activities/date/${date}.json`, accessToken).catch(e => {
                  console.log(`활동 데이터 가져오기 실패: ${e.message}, 계속 진행`);
                  return null;
                }),
                fetchFitbitDataFromServer(`/user/-/sleep/date/${date}.json`, accessToken).catch(e => {
                  console.log(`수면 데이터 가져오기 실패: ${e.message}, 계속 진행`);
                  return null;
                }),
                fetchFitbitDataFromServer(`/user/-/activities/heart/date/${date}/1d.json`, accessToken).catch(e => {
                  console.log(`심박수 데이터 가져오기 실패: ${e.message}, 계속 진행`);
                  return null;
                })
              ]);
              
              data = {
                ...(profile ? { profile } : {}),
                ...(activity ? { activity } : {}),
                ...(sleep ? { sleep } : {}),
                ...(heart ? { heart } : {}),
              };
              
              if (Object.keys(data).length === 0) {
                throw new Error('모든 데이터를 가져오는데 실패했습니다.');
              }
              
              // MongoDB에 데이터 저장
              await saveUserDataToDb(session, date, data);
            } catch (e) {
              console.error('모든 데이터 가져오기 실패, 가능한 데이터 반환:', e);
              if (Object.keys(data).length === 0) {
                throw e; // 아무 데이터도 없으면 오류 발생
              }
            }
            break;
            
          default:
            throw new Error('유효하지 않은 데이터 타입입니다.');
        }
        
        console.log('데이터 가져오기 성공:', Object.keys(data));
        return data;
      } catch (error: any) {
        console.error(`${dataType} 데이터 요청 실패:`, error);
        
        let status = 500;
        let message = error.message || '데이터를 가져오는데 실패했습니다';
        
        if (message.includes('429') || message.includes('Too Many Requests')) {
          status = 429;
          message = 'Fitbit API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        }
        
        throw { status, message };
      }
    })();
    
    // 진행 중인 요청 저장
    pendingRequests[requestKey] = fetchDataPromise;
    
    try {
      // 요청 결과 기다림
      const result = await fetchDataPromise;
      return NextResponse.json(result);
    } catch (error: any) {
      // 오류 응답 반환
      return NextResponse.json(
        {
          error: '데이터 가져오기 실패', 
          message: error.message,
          dataType: dataType,
          debug: {
            provider: session?.provider,
            hasToken: !!accessToken,
            tokenLength: accessToken?.length
          }
        }, 
        { status: error.status || 500 }
      );
    } finally {
      // 요청 처리 완료 후 참조 제거
      setTimeout(() => {
        delete pendingRequests[requestKey];
      }, 1000);
    }
    
  } catch (error: any) {
    console.error('API 핸들러 오류:', error);
    return NextResponse.json(
      { error: '서버 오류', message: error.message },
      { status: 500 }
    );
  }
}