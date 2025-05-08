import { getSession } from 'next-auth/react';

// Fitbit API 기본 URL
const FITBIT_API_URL = 'https://api.fitbit.com/1';

// 토큰 리프레시가 필요한지 확인하는 함수
export const needsTokenRefresh = (expiresAt: number) => {
  // 현재 시간이 만료 시간보다 크면 토큰 갱신 필요
  return Date.now() >= expiresAt * 1000;
};

// 토큰 리프레시 함수
export const refreshFitbitToken = async (refreshToken: string) => {
  try {
    const response = await fetch(`/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

// Fitbit API 요청을 위한 헬퍼 함수
export const fetchFitbitData = async <T>(url: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<T> => {
  const session = await getSession();
  
  if (!session?.accessToken || session.provider !== 'fitbit') {
    throw new Error('Fitbit 인증이 필요합니다.');
  }
  
  try {
    const response = await fetch(`${FITBIT_API_URL}${url}`, {
      method,
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      // 토큰이 만료된 경우 리프레시 시도
      if (session.refreshToken) {
        const refreshedTokens = await refreshFitbitToken(session.refreshToken);
        
        // 리프레시된 토큰으로 다시 요청
        const retryResponse = await fetch(`${FITBIT_API_URL}${url}`, {
          method,
          headers: {
            'Authorization': `Bearer ${refreshedTokens.access_token}`,
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Fitbit API 요청 실패: ${retryResponse.statusText}`);
        }
        
        return await retryResponse.json();
      } else {
        throw new Error('리프레시 토큰이 없습니다.');
      }
    }

    if (!response.ok) {
      throw new Error(`Fitbit API 요청 실패: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Fitbit API 요청 중 오류 발생:', error);
    throw error;
  }
};

// 사용자 프로필 정보 가져오기
export const getUserProfile = () => {
  return fetchFitbitData('/user/-/profile.json');
};

// 일일 활동 요약 가져오기
export const getDailyActivitySummary = (date: string = 'today') => {
  return fetchFitbitData<any>(`/user/-/activities/date/${date}.json`);
};

// 수면 로그 가져오기
export const getSleepLogs = (date: string = 'today') => {
  return fetchFitbitData<any>(`/user/-/sleep/date/${date}.json`);
};

// 심박수 데이터 가져오기
export const getHeartRateData = (date: string = 'today') => {
  return fetchFitbitData<any>(`/user/-/activities/heart/date/${date}/1d.json`);
};

// 체중 데이터 가져오기
export const getWeightLogs = (date: string = 'today') => {
  return fetchFitbitData<any>(`/user/-/body/log/weight/date/${date}.json`);
};