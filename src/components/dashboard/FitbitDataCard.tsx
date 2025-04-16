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
  Code,
  IconButton,
  Tooltip,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  useToast,
  Grid,
  GridItem
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
  FiDribbble, 
  FiZap,
  FiMoon,
  FiZoomIn
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
  const toast = useToast();
  const [fitbitData, setFitbitData] = useState<FitbitData>({
    loading: false,
    error: null
  });
  const [debug, setDebug] = useState<string>("");
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

  const CACHE_TIMEOUT = 5 * 60 * 1000;

  const fetchFitbitData = useCallback(async (date: string = 'today', force: boolean = false) => {
    if (pendingRequest.current) {
      console.log('이미 진행 중인 요청이 있습니다. 기존 요청을 재사용합니다.');
      return pendingRequest.current;
    }
    
    setDebug(JSON.stringify({
      hasSession: !!session,
      provider: session?.provider,
      hasAccessToken: !!session?.accessToken,
    }));

    if (!session || !session.accessToken) {
      setFitbitData(prev => ({
        ...prev,
        error: '세션 정보가 없거나 액세스 토큰이 없습니다.'
      }));
      return;
    }

    if (!force && lastFetchTime[date]) {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime[date];
      
      if (timeSinceLastFetch < CACHE_TIMEOUT) {
        console.log(`캐시된 데이터 사용 중... 날짜: ${date}, 마지막 요청: ${Math.round(timeSinceLastFetch / 1000)}초 전`);
        return;
      }
    }

    try {
      setFitbitData(prev => ({ ...prev, loading: true, error: null }));
      
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
      
      setLastFetchTime(prev => ({
        ...prev,
        [date]: Date.now()
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
      
      if (isAutoRefresh) {
        toast({
          title: isRateLimitError ? "API 요청 한도 초과" : "데이터 동기화 오류",
          description: error.message || '데이터를 불러오는데 문제가 발생했습니다',
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        
        if (isRateLimitError) {
          setIsAutoRefresh(false);
        }
      }
      
      return null;
    } finally {
      pendingRequest.current = null;
    }
  }, [session, toast, isAutoRefresh, isInitialLoaded, lastFetchTime]);

  const handleRefresh = () => {
    toast({
      title: "데이터 동기화 중",
      description: "Fitbit 데이터를 새로 가져오고 있습니다...",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
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
    setIsAutoRefresh(prev => !prev);
  };

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    if (isAutoRefresh && session?.accessToken) {
      refreshInterval = setInterval(() => {
        console.log('자동 새로고침 실행');
        fetchFitbitData(selectedDate);
      }, autoRefreshInterval);
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isAutoRefresh, session, selectedDate, fetchFitbitData, autoRefreshInterval]);

  useEffect(() => {
    // 세션이 없거나 초기 데이터 로딩이 이미 완료된 경우 중복 요청 방지
    if (!session?.accessToken || initialFetchDone.current) {
      return;
    }
    
    console.log('초기 Fitbit 데이터 로드 시작 - 한 번만 실행');
    initialFetchDone.current = true;
    fetchFitbitData(selectedDate);
    
    // 컴포넌트가 언마운트될 때 초기화
    return () => {
      initialFetchDone.current = false;
    };
  }, [session, selectedDate, fetchFitbitData]);

  const renderDebugInfo = () => {
    if (process.env.NODE_ENV !== 'production') {
      return (
        <Box mt={4} p={2} bg="gray.100" borderRadius="md">
          <Text fontSize="xs" fontWeight="bold">디버그 정보:</Text>
          <Code fontSize="xs" whiteSpace="pre-wrap" w="100%" overflowX="auto">{debug}</Code>
        </Box>
      );
    }
    return null;
  };

  const renderLastUpdated = () => {
    if (!fitbitData.lastUpdated) return null;
    
    return (
      <Text fontSize="xs" color="gray.500">
        마지막 업데이트: {format(fitbitData.lastUpdated, 'yyyy년 MM월 dd일 HH:mm:ss', { locale: ko })}
      </Text>
    );
  };

  const renderHeaderActions = () => {
    return (
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
    );
  };

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
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
          <Card bg="white" boxShadow="md" borderRadius="lg">
            <CardBody p={4}>
              <Flex align="center" justify="space-between" mb={1}>
                <Box bg="blue.50" p={2} borderRadius="md">
                  <FiHeart color="#3182CE" />
                </Box>
                {renderTrendIndicator(mockTrendData.heartRate.trend)}
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={2}>Heart Rate</Text>
              <Flex align="baseline">
                <Text fontSize="3xl" fontWeight="bold">{heartData?.restingHeartRate || mockTrendData.heartRate.value}</Text>
                <Text ml={1} fontSize="md" color="gray.500">bpm</Text>
              </Flex>
            </CardBody>
          </Card>

          <Card bg="white" boxShadow="md" borderRadius="lg">
            <CardBody p={4}>
              <Flex align="center" justify="space-between" mb={1}>
                <Box bg="blue.50" p={2} borderRadius="md">
                  <FiActivity color="#3182CE" />
                </Box>
                {renderTrendIndicator(mockTrendData.steps.trend)}
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={2}>Steps</Text>
              <Text fontSize="3xl" fontWeight="bold">
                {activityData?.steps?.toLocaleString() || mockTrendData.steps.value.toLocaleString()}
              </Text>
            </CardBody>
          </Card>

          <Card bg="white" boxShadow="md" borderRadius="lg">
            <CardBody p={4}>
              <Flex align="center" justify="space-between" mb={1}>
                <Box bg="blue.50" p={2} borderRadius="md">
                  <FiMoon color="#3182CE" />
                </Box>
                {renderTrendIndicator(mockTrendData.sleep.trend)}
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={2}>Sleep</Text>
              <Flex align="baseline">
                <Text fontSize="3xl" fontWeight="bold">
                  {sleepData ? (Math.floor(sleepData.totalTimeInBed / 60) + (sleepData.totalTimeInBed % 60) / 100).toFixed(1) : mockTrendData.sleep.value}
                </Text>
                <Text ml={1} fontSize="md" color="gray.500">hrs</Text>
              </Flex>
            </CardBody>
          </Card>

          <Card bg="white" boxShadow="md" borderRadius="lg">
            <CardBody p={4}>
              <Flex align="center" justify="space-between" mb={1}>
                <Box bg="blue.50" p={2} borderRadius="md">
                  <FiZap color="#3182CE" />
                </Box>
                {renderTrendIndicator(mockTrendData.calories.trend)}
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={2}>Calories</Text>
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
                <Box bg="blue.50" p={2} borderRadius="md">
                  <FiClock color="#3182CE" />
                </Box>
                {renderTrendIndicator(mockTrendData.activeMinutes.trend)}
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={2}>Active Minutes</Text>
              <Flex align="baseline">
                <Text fontSize="3xl" fontWeight="bold">
                  {activityData ? (activityData.fairlyActiveMinutes || 0) + (activityData.veryActiveMinutes || 0) : mockTrendData.activeMinutes.value}
                </Text>
                <Text ml={1} fontSize="md" color="gray.500">min</Text>
              </Flex>
            </CardBody>
          </Card>

          <Card bg="white" boxShadow="md" borderRadius="lg">
            <CardBody p={4}>
              <Flex align="center" justify="space-between" mb={1}>
                <Box bg="blue.50" p={2} borderRadius="md">
                  <FiZoomIn color="#3182CE" />
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
                  <Box bg="blue.50" p={2} borderRadius="md" mr={2}>
                    <FiMoon color="#3182CE" />
                  </Box>
                  <Text fontWeight="medium">Sleep Quality</Text>
                </Flex>
              </Box>
              <Text fontWeight="bold" color="blue.500">Last Night</Text>
            </Flex>
            
            <Progress 
              value={sleepData?.efficiency || mockTrendData.sleepQuality.value} 
              colorScheme="blue" 
              size="lg" 
              borderRadius="full" 
              my={3} 
            />
            
            <Flex justify="space-between">
              <Text fontSize="sm" color="gray.500">Hours Slept</Text>
              <Text fontWeight="bold">
                {sleepData ? `${Math.floor(sleepData.totalTimeInBed / 60)}.${sleepData.totalTimeInBed % 60} hrs` : `${mockTrendData.sleep.value} hrs`}
              </Text>
            </Flex>
            <Text fontSize="sm" fontWeight="bold" textAlign="right" mt={1}>
              {sleepData?.efficiency || mockTrendData.sleepQuality.value}%
            </Text>
          </CardBody>
        </Card>
      </Stack>
    );
  };

  if (!session?.accessToken) {
    return (
      <Card>
        <CardHeader>
          <Heading size="md">Fitbit 데이터</Heading>
        </CardHeader>
        <CardBody>
          <Alert status="info">
            <AlertIcon />
            Fitbit 계정으로 로그인하면 건강 데이터를 확인할 수 있습니다.
          </Alert>
          {renderDebugInfo()}
        </CardBody>
      </Card>
    );
  }

  if (fitbitData.loading && !isInitialLoaded) {
    return (
      <Card>
        <CardHeader>
          <Heading size="md">Fitbit 데이터 로딩 중</Heading>
        </CardHeader>
        <CardBody>
          <Flex justifyContent="center" alignItems="center" p={10}>
            <Spinner size="xl" />
          </Flex>
          {renderDebugInfo()}
        </CardBody>
      </Card>
    );
  }

  if (fitbitData.error && !isInitialLoaded) {
    return (
      <Card>
        <CardHeader>
          <Heading size="md">Fitbit 데이터</Heading>
        </CardHeader>
        <CardBody>
          <Alert status="error">
            <AlertIcon />
            {fitbitData.error}
          </Alert>
          <Button mt={4} onClick={() => fetchFitbitData(selectedDate)}>다시 시도</Button>
          {renderDebugInfo()}
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
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
          {renderHeaderActions()}
        </Flex>
        {renderLastUpdated()}
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
              <Spinner size="sm" mr={2} />
              <Text>데이터 동기화 중...</Text>
            </Flex>
          )}
          
          {fitbitData.error && (
            <Alert status="error" mt={4}>
              <AlertIcon />
              {fitbitData.error}
            </Alert>
          )}
          
          {renderDebugInfo()}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default FitbitDataCard;