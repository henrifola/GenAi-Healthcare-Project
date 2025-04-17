import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/lib/auth/nextAuthOptions';
import connectDB from '@/lib/db/mongoose';
import User from '@/lib/db/models/user.model';
import FitbitActivity from '@/lib/db/models/fitbit-activity.model';
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
  const cacheKey = `${url}-${accessToken.substring(0, 10)}`;
  
  // 캐시 확인
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // 429 오류에 대한 지수 백오프 재시도
  if (retryCount > 0) {
    const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000); // 최대 10초
    await delay(delayMs);
  }
  
  try {
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept-Language': 'ko_KR',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    };
    
    const response = await fetch(`${FITBIT_API_URL}${url}`, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    // 429 Too Many Requests 오류 처리
    if (response.status === 429 && retryCount < maxRetries) {
      return await fetchFitbitDataFromServer(url, accessToken, retryCount + 1, maxRetries);
    }

    if (!response.ok) {
      // 오류 응답 처리
      let errorDetail = '';
      try {
        const errorJson = await response.json();
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

    // JSON 파싱 시도
    const data = await response.json();
    
    // 성공한 응답 캐시에 저장
    setCacheData(cacheKey, data);
    
    return data;
  } catch (error) {
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
        activities: fitbitData.activity?.activities || []
      }
    };
    
    // upsert: true - 데이터가 없으면 생성, 있으면 업데이트
    await FitbitActivity.findOneAndUpdate(
      { userId: user._id, date: date }, 
      activityData, 
      {
        upsert: true,
        new: true
      }
    );
    
    return true;
  } catch (error) {
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
      } else {
        // 3. 기존 NextAuth 세션 사용
        session = await getServerSession(nextAuthOptions);
        if (session) {
          accessToken = session.accessToken;
        }
      }
    }
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    
    // 토큰 검증
    if (!accessToken) {
      return NextResponse.json({
        error: 'Fitbit 액세스 토큰이 없습니다. 재로그인이 필요합니다.'
      }, { status: 403 });
    }
    
    // 요청 파라미터 가져오기
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || 'today';
    const dataType = searchParams.get('type') || 'all';
    
    // 동일한 요청에 대한 중복 방지를 위한 키
    const requestKey = `${date}-${dataType}-${accessToken.substring(0, 10)}`;
    
    // 이미 진행 중인 동일한 요청이 있는지 확인
    if (pendingRequests[requestKey]) {
      try {
        // 기존 요청의 결과를 기다림
        const data = await pendingRequests[requestKey];
        return NextResponse.json(data);
      } catch (error: any) {
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
            data = await fetchFitbitDataFromServer(`/user/-/activities/date/${date}.json`, accessToken);
            break;
            
          case 'sleep':
            data = await fetchFitbitDataFromServer(`/user/-/sleep/date/${date}.json`, accessToken);
            break;
            
          case 'heart':
            data = await fetchFitbitDataFromServer(`/user/-/activities/heart/date/${date}/1d.json`, accessToken);
            break;
            
          case 'all':
            try {
              // 모든 데이터 병렬로 가져오기
              const [profile, activity, sleep, heart] = await Promise.all([
                fetchFitbitDataFromServer('/user/-/profile.json', accessToken).catch(e => {
                  return null;
                }),
                fetchFitbitDataFromServer(`/user/-/activities/date/${date}.json`, accessToken).catch(e => {
                  return null;
                }),
                fetchFitbitDataFromServer(`/user/-/sleep/date/${date}.json`, accessToken).catch(e => {
                  return null;
                }),
                fetchFitbitDataFromServer(`/user/-/activities/heart/date/${date}/1d.json`, accessToken).catch(e => {
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
              if (Object.keys(data).length === 0) {
                throw e; // 아무 데이터도 없으면 오류 발생
              }
            }
            break;
            
          default:
            throw new Error('유효하지 않은 데이터 타입입니다.');
        }
        
        return data;
      } catch (error: any) {
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
          message: error.message
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
    return NextResponse.json(
      { error: '서버 오류', message: error.message },
      { status: 500 }
    );
  }
}