'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardBody, 
  CardHeader, 
  Heading, 
  Stack,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  Flex,
  Button,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  IconButton,
  Tooltip,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  VStack
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { 
  FiActivity, 
  FiClock, 
  FiHeart, 
  FiAlertCircle, 
  FiRefreshCw, 
  FiCalendar, 
  FiTrendingUp, 
  FiZap,
  FiMoon,
  FiCheckCircle
} from 'react-icons/fi';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TrendData {
  value: number;
  trend?: number;
}

interface FitbitData {
  profile?: any;
  activity?: any;
  sleep?: any;
  heart?: any;
  hrv?: TrendData;
  loading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

const FitbitDataCard = () => {
  const { data: session } = useSession();
  const [fitbitData, setFitbitData] = useState<FitbitData>({
    loading: false,
    error: null
  });
  const [selectedDate, setSelectedDate] = useState<string>('today');
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(5 * 60 * 1000);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Record<string, number>>({});
  const [mockTrendData, setMockTrendData] = useState({
    heartRate: { value: 72, trend: -2 },
    steps: { value: 8456, trend: 12 },
    sleep: { value: 7.5, trend: 5 },
    calories: { value: 450, trend: -3 },
    activeMinutes: { value: 45, trend: 5 },
    hrv: { value: 45, trend: 5 },
    sleepQuality: { value: 75, trend: 0 }
  });
  
  const initialFetchDone = useRef(false);
  const pendingRequest = useRef<Promise<any> | null>(null);

  const CACHE_TIMEOUT = 5 * 60 * 1000; // 5분
  const CACHE_KEY_PREFIX = 'fitbit-data-';

  // 로컬 스토리지에 캐시 저장하는 함수
  const saveToCache = (key: string, data: any) => {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('캐시 저장 오류:', error);
    }
  };

  // 로컬 스토리지에서 캐시 가져오는 함수
  const getFromCache = (key: string) => {
    try {
      const cacheItemString = localStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
      if (!cacheItemString) return null;
      
      const cacheItem = JSON.parse(cacheItemString);
      const now = Date.now();
      
      // 캐시가 만료되었는지 확인
      if (now - cacheItem.timestamp > CACHE_TIMEOUT) {
        localStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.error('캐시 조회 오류:', error);
      return null;
    }
  };

  const fetchFitbitData = useCallback(async (date: string = 'today', force: boolean = false) => {
    if (pendingRequest.current) {
      console.log('이미 진행 중인 요청이 있습니다. 기존 요청을 재사용합니다.');
      return pendingRequest.current;
    }

    if (!session || !session.accessToken) {
      setFitbitData(prev => ({
        ...prev,
        error: '세션 정보가 없거나 액세스 토큰이 없습니다.'
      }));
      return;
    }

    // 캐시 키 생성
    const cacheKey = `${date}`;
    
    // 강제 새로고침이 아닐 경우 캐시 확인
    if (!force) {
      // 로컬 스토리지에서 캐시된 데이터 확인
      const cachedData = getFromCache(cacheKey);
      
      if (cachedData) {
        console.log(`캐시된 데이터 사용 중... 날짜: ${date}`);
        
        setFitbitData({
          profile: cachedData.profile,
          activity: cachedData.activity,
          sleep: cachedData.sleep,
          heart: cachedData.heart,
          loading: false,
          error: null,
          lastUpdated: new Date(cachedData.lastUpdated)
        });
        
        // 캐시된 타임스탬프 확인
        const now = Date.now();
        const timeSinceLastFetch = now - (cachedData.timestamp || 0);
        
        // 캐시가 5분 내라면 API 호출 건너뛰기
        if (timeSinceLastFetch < CACHE_TIMEOUT) {
          console.log(`최근 캐시 사용 중... 마지막 요청: ${Math.round(timeSinceLastFetch / 1000)}초 전`);
          return cachedData;
        }
        
        // 캐시가 있지만 5분이 지났으면 백그라운드에서 새로운 데이터 가져오기
        console.log('캐시가 5분 이상 지났습니다. 백그라운드에서 데이터 다시 가져오기...');
        // 로딩 상태는 true로 설정하지 않음 (백그라운드 갱신이므로 UI에 로딩 표시 안함)
      }
    }

    try {
      // 강제 새로고침이거나 캐시가 없는 경우에만 로딩 상태 표시
      if (force || !getFromCache(cacheKey)) {
        setFitbitData(prev => ({ ...prev, loading: true, error: null }));
      }
      
      console.log(`Fitbit 데이터 요청 중... 날짜: ${date}`);
      
      pendingRequest.current = fetch(`/api/fitbit/user-data?date=${date}&type=all`).then(async (response) => {
        if (response.status === 429) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Fitbit API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API 응답 오류:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(errorData.message || `Fitbit 데이터를 가져오는데 실패했습니다: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
      });
      
      const data = await pendingRequest.current;
      console.log('Fitbit 데이터 수신:', Object.keys(data));
      
      // 로컬 스토리지에 캐시 저장
      const currentTime = Date.now();
      const dataToCache = {
        ...data,
        timestamp: currentTime,
        lastUpdated: new Date().toISOString()
      };
      
      saveToCache(cacheKey, dataToCache);
      
      setLastFetchTime(prev => ({
        ...prev,
        [date]: currentTime
      }));
      
      setFitbitData({
        profile: data.profile,
        activity: data.activity,
        sleep: data.sleep,
        heart: data.heart,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      if (!isInitialLoaded) {
        setIsInitialLoaded(true);
      }
      
      return data;
    } catch (error: any) {
      console.error('Fitbit 데이터 요청 오류:', error);
      
      const isRateLimitError = error.message && (
        error.message.includes('429') || 
        error.message.includes('Too Many Requests') || 
        error.message.includes('요청 한도')
      );
      
      setFitbitData(prev => ({
        ...prev,
        loading: false,
        error: error.message || '데이터를 불러오는데 문제가 발생했습니다',
        profile: isRateLimitError ? prev.profile : prev.profile,
        activity: isRateLimitError ? prev.activity : prev.activity,
        sleep: isRateLimitError ? prev.sleep : prev.sleep,
        heart: isRateLimitError ? prev.heart : prev.heart,
      }));
      
      return null;
    } finally {
      pendingRequest.current = null;
    }
  }, [session, isInitialLoaded]);

  const handleRefresh = () => {
    fetchFitbitData(selectedDate, true);
  };

  const handleDateSelect = (daysAgo: number) => {
    let dateString = 'today';
    if (daysAgo > 0) {
      const date = subDays(new Date(), daysAgo);
      dateString = format(date, 'yyyy-MM-dd');
    }
    setSelectedDate(dateString);
    fetchFitbitData(dateString);
  };

  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh);
  };

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    if (isAutoRefresh && session?.accessToken) {
      refreshInterval = setInterval(() => {
        fetchFitbitData(selectedDate);
      }, autoRefreshInterval);
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isAutoRefresh, session, selectedDate, fetchFitbitData, autoRefreshInterval]);

  useEffect(() => {
    if (!session?.accessToken || initialFetchDone.current) {
      return;
    }
    
    initialFetchDone.current = true;
    fetchFitbitData(selectedDate);
    
    return () => {
      initialFetchDone.current = false;
    };
  }, [session, selectedDate, fetchFitbitData]);

  const renderTrendIndicator = (trend: number | undefined) => {
    if (trend === undefined || trend === 0) return null;
    
    return (
      <Stat>
        <StatHelpText m={0}>
          <StatArrow type={trend > 0 ? 'increase' : 'decrease'} />
          {Math.abs(trend)}%
        </StatHelpText>
      </Stat>
    );
  };

  const renderDailyAnalysis = () => {
    const activityData = fitbitData.activity?.summary;
    const sleepData = fitbitData.sleep?.summary;
    const heartData = fitbitData.heart?.['activities-heart']?.[0]?.value;
    
    const steps = activityData?.steps || mockTrendData.steps.value;
    const sleep = sleepData 
      ? (Math.floor(sleepData.totalTimeInBed / 60) + (sleepData.totalTimeInBed % 60) / 100).toFixed(1) 
      : mockTrendData.sleep.value;
    const hrv = mockTrendData.hrv.value;
    const restingHeartRate = heartData?.restingHeartRate || mockTrendData.heartRate.value;
    
    return (
      <Card bg="white" boxShadow="md" borderRadius="lg" p={4}>
        <VStack align="stretch" spacing={4}>
          <Flex justify="space-between">
            <Heading size="md">건강 인사이트</Heading>
            <Text color="gray.500">일일 분석</Text>
          </Flex>
          
          <Flex align="center">
            <Box bg="blue.50" p={2} borderRadius="md" mr={3}>
              <FiActivity color="#3182CE" />
            </Box>
            <Text fontSize="lg" fontWeight="medium">일일 활동 및 회복</Text>
          </Flex>
          
          <Text>
            오늘은 {steps.toLocaleString()}걸음과 {sleep}시간 수면으로 심장 및 전반적인 건강을 
            {steps >= 8000 ? ' 잘 ' : ' 적절히 '}
            유지하고 있습니다. 
            {steps < 10000 
              ? `최적의 심혈관 건강을 위해 ${(10000 - steps).toLocaleString()}걸음 더 걸으면 10,000걸음 목표에 도달할 수 있습니다.` 
              : '10,000걸음 목표를 달성하셨습니다! 훌륭합니다.'}
            {' '}
            HRV(현재 {hrv}ms)는 
            {hrv >= 50 ? '정상 범위 이상입니다! 스트레스 대처 능력이 좋은 상태입니다.' : 
             hrv >= 40 ? '정상 범위입니다. 명상이나 가벼운 유산소 운동을 통해 스트레스 대처 능력과 전반적인 회복력을 향상시킬 수 있습니다.' : 
             '정상보다 약간 낮습니다. 더 많은 휴식과 스트레스 관리가 필요할 수 있습니다.'}
            {' '}
            안정시 심박수는 {restingHeartRate}bpm으로 
            {restingHeartRate <= 60 ? '매우 건강한 수준입니다.' : 
             restingHeartRate <= 70 ? '양호한 상태입니다.' : 
             restingHeartRate <= 80 ? '보통 수준입니다.' : 
             '약간 높은 편입니다. 유산소 운동을 통해 개선해보세요.'}
          </Text>
          
          <Box>
            <Text fontWeight="medium" mb={2}>추천사항</Text>
            <HStack spacing={2} mb={2}>
              <Box color="blue.500"><FiCheckCircle /></Box>
              <Text>{steps < 10000 ? `오늘 ${Math.min(3000, 10000 - steps).toLocaleString()}걸음 더 걸어 활동량 늘리기` : '걸음수 목표 달성을 유지하기'}</Text>
            </HStack>
            <HStack spacing={2} mb={2}>
              <Box color="blue.500"><FiCheckCircle /></Box>
              <Text>{hrv < 45 ? '취침 전 심호흡 운동으로 HRV 개선하기' : 'HRV 수준을 유지하기 위한 규칙적 휴식 취하기'}</Text>
            </HStack>
            <HStack spacing={2}>
              <Box color="blue.500"><FiCheckCircle /></Box>
              <Text>{Number(sleep) < 7 ? `수면 시간을 ${(7 - Number(sleep)).toFixed(1)}시간 증가시켜 최소 7시간 수면 취하기` : '최적의 회복을 위한 일관된 수면 패턴 유지하기'}</Text>
            </HStack>
          </Box>
        </VStack>
      </Card>
    );
  };

  const renderDashboard = () => {
    const activityData = fitbitData.activity?.summary;
    const sleepData = fitbitData.sleep?.summary;
    const heartData = fitbitData.heart?.['activities-heart']?.[0]?.value;

    if (!activityData && !sleepData && !heartData) {
      return (
        <Alert status="warning">
          <AlertIcon />
          건강 데이터를 불러올 수 없습니다. 새로고침을 시도해보세요.
        </Alert>
      );
    }

    return (
      <Stack spacing={6}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
          <Card bg="white" boxShadow="md" borderRadius="lg">
            <CardBody p={4}>
              <Flex align="center" justify="space-between" mb={1}>
                <Box color="blue.500">
                  <FiHeart size="24px" />
                </Box>
                {renderTrendIndicator(mockTrendData.heartRate.trend)}
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={2}>심박수</Text>
              <Flex align="baseline">
                <Text fontSize="3xl" fontWeight="bold">{heartData?.restingHeartRate || mockTrendData.heartRate.value}</Text>
                <Text ml={1} fontSize="md" color="gray.500">bpm</Text>
              </Flex>
            </CardBody>
          </Card>

          <Card bg="white" boxShadow="md" borderRadius="lg">
            <CardBody p={4}>
              <Flex align="center" justify="space-between" mb={1}>
                <Box color="blue.500">
                  <FiActivity size="24px" />
                </Box>
                {renderTrendIndicator(mockTrendData.steps.trend)}
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={2}>걸음 수</Text>
              <Text fontSize="3xl" fontWeight="bold">
                {activityData?.steps?.toLocaleString() || mockTrendData.steps.value.toLocaleString()}
              </Text>
            </CardBody>
          </Card>

          <Card bg="white" boxShadow="md" borderRadius="lg">
            <CardBody p={4}>
              <Flex align="center" justify="space-between" mb={1}>
                <Box color="blue.500">
                  <FiMoon size="24px" />
                </Box>
                {renderTrendIndicator(mockTrendData.sleep.trend)}
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={2}>수면</Text>
              <Flex align="baseline">
                <Text fontSize="3xl" fontWeight="bold">
                  {sleepData ? (Math.floor(sleepData.totalTimeInBed / 60) + (sleepData.totalTimeInBed % 60) / 100).toFixed(1) : mockTrendData.sleep.value}
                </Text>
                <Text ml={1} fontSize="md" color="gray.500">시간</Text>
              </Flex>
            </CardBody>
          </Card>

          <Card bg="white" boxShadow="md" borderRadius="lg">
            <CardBody p={4}>
              <Flex align="center" justify="space-between" mb={1}>
                <Box color="blue.500">
                  <FiZap size="24px" />
                </Box>
                {renderTrendIndicator(mockTrendData.calories.trend)}
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={2}>칼로리</Text>
              <Flex align="baseline">
                <Text fontSize="3xl" fontWeight="bold">
                  {activityData?.caloriesOut || mockTrendData.calories.value}
                </Text>
                <Text ml={1} fontSize="md" color="gray.500">kcal</Text>
              </Flex>
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Card bg="white" boxShadow="md" borderRadius="lg">
            <CardBody p={4}>
              <Flex align="center" justify="space-between" mb={1}>
                <Box color="blue.500">
                  <FiClock size="24px" />
                </Box>
                {renderTrendIndicator(mockTrendData.activeMinutes.trend)}
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={2}>활동 시간</Text>
              <Flex align="baseline">
                <Text fontSize="3xl" fontWeight="bold">
                  {activityData ? (activityData.fairlyActiveMinutes || 0) + (activityData.veryActiveMinutes || 0) : mockTrendData.activeMinutes.value}
                </Text>
                <Text ml={1} fontSize="md" color="gray.500">분</Text>
              </Flex>
            </CardBody>
          </Card>

          <Card bg="white" boxShadow="md" borderRadius="lg">
            <CardBody p={4}>
              <Flex align="center" justify="space-between" mb={1}>
                <Box color="blue.500">
                  <FiTrendingUp size="24px" />
                </Box>
                {renderTrendIndicator(mockTrendData.hrv.trend)}
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={2}>HRV</Text>
              <Flex align="baseline">
                <Text fontSize="3xl" fontWeight="bold">{mockTrendData.hrv.value}</Text>
                <Text ml={1} fontSize="md" color="gray.500">ms</Text>
              </Flex>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card bg="white" boxShadow="md" borderRadius="lg">
          <CardBody p={4}>
            <Flex justify="space-between" mb={2}>
              <Box>
                <Flex align="center">
                  <Box color="blue.500" mr={2}>
                    <FiMoon size="24px" />
                  </Box>
                  <Text fontWeight="medium">수면 품질</Text>
                </Flex>
              </Box>
              <Text fontWeight="bold" color="blue.500">지난 밤</Text>
            </Flex>
            
            <Progress 
              value={sleepData?.efficiency || mockTrendData.sleepQuality.value} 
              colorScheme="blue" 
              size="lg" 
              borderRadius="full" 
              my={3} 
            />
            
            <Flex justify="space-between">
              <Text fontSize="sm" color="gray.500">수면 시간</Text>
              <Text fontWeight="bold">
                {sleepData ? `${Math.floor(sleepData.totalTimeInBed / 60)}.${sleepData.totalTimeInBed % 60} 시간` : `${mockTrendData.sleep.value} 시간`}
              </Text>
            </Flex>
            <Text fontSize="sm" fontWeight="bold" textAlign="right" mt={1}>
              {sleepData?.efficiency || mockTrendData.sleepQuality.value}%
            </Text>
          </CardBody>
        </Card>

        {renderDailyAnalysis()}
      </Stack>
    );
  };

  if (!session?.accessToken) {
    return (
      <Card boxShadow="md" borderRadius="lg">
        <CardHeader>
          <Heading size="md">Fitbit 데이터</Heading>
        </CardHeader>
        <CardBody>
          <Alert status="info">
            <AlertIcon />
            Fitbit 계정으로 로그인하면 건강 데이터를 확인할 수 있습니다.
          </Alert>
        </CardBody>
      </Card>
    );
  }

  if (fitbitData.loading && !isInitialLoaded) {
    return (
      <Card boxShadow="md" borderRadius="lg">
        <CardHeader>
          <Heading size="md">Fitbit 데이터 로딩 중</Heading>
        </CardHeader>
        <CardBody>
          <Flex justifyContent="center" alignItems="center" p={10}>
            <Spinner size="xl" colorScheme="blue" />
          </Flex>
        </CardBody>
      </Card>
    );
  }

  if (fitbitData.error && !isInitialLoaded) {
    return (
      <Card boxShadow="md" borderRadius="lg">
        <CardHeader>
          <Heading size="md">Fitbit 데이터</Heading>
        </CardHeader>
        <CardBody>
          <Alert status="error">
            <AlertIcon />
            {fitbitData.error}
          </Alert>
          <Button mt={4} colorScheme="blue" onClick={() => fetchFitbitData(selectedDate)}>다시 시도</Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card boxShadow="md" borderRadius="lg">
      <CardHeader>
        <Flex justify="space-between" align="center">
          <HStack>
            <Heading size="md">Fitbit 건강 데이터</Heading>
            <Badge colorScheme="green">연동됨</Badge>
            {selectedDate !== 'today' && (
              <Badge colorScheme="purple">
                {selectedDate === 'today' 
                  ? '오늘' 
                  : format(new Date(selectedDate), 'yyyy년 MM월 dd일', { locale: ko })}
              </Badge>
            )}
          </HStack>
          <HStack spacing={2}>
            <Tooltip label="데이터 동기화">
              <IconButton
                aria-label="새로고침"
                icon={<FiRefreshCw />}
                size="sm"
                isLoading={fitbitData.loading}
                onClick={handleRefresh}
              />
            </Tooltip>
            
            <Tooltip label={isAutoRefresh ? "자동 동기화 중지" : "자동 동기화 시작"}>
              <IconButton
                aria-label="자동 동기화"
                icon={<FiRefreshCw />}
                size="sm"
                colorScheme={isAutoRefresh ? "green" : "gray"}
                onClick={toggleAutoRefresh}
              />
            </Tooltip>
            
            <Menu>
              <Tooltip label="날짜 선택">
                <MenuButton as={IconButton} aria-label="날짜 선택" icon={<FiCalendar />} size="sm" />
              </Tooltip>
              <MenuList>
                <MenuItem onClick={() => handleDateSelect(0)}>오늘</MenuItem>
                <MenuItem onClick={() => handleDateSelect(1)}>어제</MenuItem>
                <MenuItem onClick={() => handleDateSelect(2)}>2일 전</MenuItem>
                <MenuItem onClick={() => handleDateSelect(3)}>3일 전</MenuItem>
                <MenuItem onClick={() => handleDateSelect(7)}>일주일 전</MenuItem>
              </MenuList>
            </Menu>
            
            {isAutoRefresh && <Badge colorScheme="green">자동 동기화 중</Badge>}
          </HStack>
        </Flex>
        {fitbitData.lastUpdated && (
          <Text fontSize="xs" color="gray.500">
            마지막 업데이트: {format(fitbitData.lastUpdated, 'yyyy년 MM월 dd일 HH:mm:ss', { locale: ko })}
          </Text>
        )}
      </CardHeader>
      <CardBody>
        <Stack spacing={4}>
          {fitbitData.profile && (
            <Box>
              <Text fontWeight="bold">
                {fitbitData.profile.user?.fullName || '사용자'} 님의 건강 데이터
              </Text>
            </Box>
          )}

          {renderDashboard()}
          
          {fitbitData.loading && (
            <Flex justify="center">
              <Spinner size="sm" mr={2} colorScheme="blue" />
              <Text>데이터 동기화 중...</Text>
            </Flex>
          )}
          
          {fitbitData.error && (
            <Alert status="error" mt={4}>
              <AlertIcon />
              {fitbitData.error}
            </Alert>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default FitbitDataCard;