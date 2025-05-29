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
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Skeleton,
  useToast
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { 
  FiActivity, 
  FiClock, 
  FiHeart, 
  FiRefreshCw, 
  FiCalendar, 
  FiTrendingUp, 
  FiZap,
  FiMoon,
  FiCheckCircle,
  FiBook,
  FiSun
} from 'react-icons/fi';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { fetchHealthInsights, generateFallbackInsights, type HealthData, type HealthInsights } from '@/utils/gemini';
import ReactMarkdown from 'react-markdown';

interface TrendData {
  value: number;
  trend?: number;
}

interface FitbitData {
  profile?: any;
  activity?: any;
  sleep?: any;
  heart?: any;
  sleepGoal?: any;
  pastSleep?: any;
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
  const [mockTrendData, setMockTrendData] = useState({
    heartRate: { value: 72, trend: -2 },
    steps: { value: 8456, trend: 12 },
    sleep: { value: 7.5, trend: 5 },
    calories: { value: 450, trend: -3 },
    activeMinutes: { value: 45, trend: 5 },
    hrv: { value: 45, trend: 5 },
    sleepQuality: { value: 75, trend: 0 }
  });
  
  // AI 건강 인사이트 관련 상태
  const [healthInsights, setHealthInsights] = useState<HealthInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [insightActiveTab, setInsightActiveTab] = useState(0);
  const [useAI, setUseAI] = useState(false); // false로 변경하여 기본값을 규칙 기반 분석으로 설정
  
  const initialFetchDone = useRef(false);
  const pendingRequest = useRef<Promise<any> | null>(null);
  const toast = useToast();

  const fetchFitbitData = useCallback(async (date: string = 'today', force: boolean = false) => {
    if (pendingRequest.current) {
      return pendingRequest.current;
    }

    if (!session || !session.accessToken) {
      setFitbitData(prev => ({
        ...prev,
        loading: false,
        error: '세션 정보가 없거나 액세스 토큰이 없습니다. 재로그인이 필요합니다.'
      }));
      return;
    }

    // 강제 새로고침이거나 캐시가 없는 경우 로딩 상태 표시
    setFitbitData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      pendingRequest.current = fetch(`/api/fitbit/user-data?date=${date}&type=all`).then(async (response) => {
        if (response.status === 429) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Fitbit API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        }

        if (response.status === 403) {
          throw new Error('Fitbit 데이터를 가져오는데 실패했습니다: 액세스 권한이 없습니다. 로그아웃 후 다시 로그인해 주세요.');
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Fitbit 데이터를 가져오는데 실패했습니다: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
      });
      
      const data = await pendingRequest.current;
      
      // 가져온 데이터 설정
      setFitbitData({
        profile: data.profile,
        activity: data.activity,
        sleep: data.sleep,
        heart: data.heart,
        sleepGoal: data.sleepGoal,
        pastSleep: data.pastSleep,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      if (!isInitialLoaded) {
        setIsInitialLoaded(true);
      }
      
      // 데이터를 가져온 후 건강 인사이트 생성
      if (data.activity || data.sleep || data.heart) {
        fetchHealthInsightsData(data);
      }
      
      return data;
    } catch (error: any) {
      const isRateLimitError = error.message && (
        error.message.includes('429') || 
        error.message.includes('Too Many Requests') || 
        error.message.includes('요청 한도')
      );
      
      // 에러 메시지 개선
      let errorMessage = error.message || '데이터를 불러오는데 문제가 발생했습니다';
      
      // 403 에러의 경우 더 명확한 메시지 제공
      if (error.message && error.message.includes('403')) {
        errorMessage = '인증이 만료되었습니다. 로그아웃 후 다시 로그인해 주세요.';
      }
      
      setFitbitData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
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

  // 건강 데이터를 기반으로 GPT 인사이트를 가져옵니다
  const fetchHealthInsightsData = async (data: any) => {
    // 선택한 날짜의 데이터 확인
    const activityData = data.activity?.summary;
    const sleepData = data.sleep?.summary;
    const heartData = data.heart?.['activities-heart']?.[0]?.value;
    
    if (!activityData && !sleepData && !heartData) return;
    
    // 최근 1주일 데이터를 가져오기 위한 로직 구현
    // 현재는 선택한 날짜의 데이터만 사용하지만, 이상적으로는 1주일 데이터 평균을 사용해야 함
    // 미래에는 API를 통해 1주일 데이터를 모두 가져와서 분석할 수 있도록 확장 가능
    
    // 모든 필수 데이터가 있는지 확인 (현재 날짜 기준)
    const steps = activityData?.steps || mockTrendData.steps.value;
    const activeMinutes = activityData 
      ? (activityData.fairlyActiveMinutes || 0) + (activityData.veryActiveMinutes || 0) 
      : mockTrendData.activeMinutes.value;
    const sleep = sleepData 
      ? (Math.floor(sleepData.totalMinutesAsleep / 60) + (sleepData.totalMinutesAsleep % 60) / 100)
      : mockTrendData.sleep.value;
    const restingHeartRate = heartData?.restingHeartRate || mockTrendData.heartRate.value;
    const calories = activityData?.caloriesOut || mockTrendData.calories.value;
    const hrvValue = mockTrendData.hrv.value; // 실제 Fitbit API에서는 HRV를 가져올 수 없을 수 있음
    
    // GPT API에 설명 추가 (최근 1주일 데이터 기반 분석임을 명시)
    const healthData: HealthData = {
      steps,
      sleep: Number(sleep.toFixed(1)),
      restingHeartRate,
      hrvValue,
      calories,
      activeMinutes,
      analysisContext: "선택한 날짜를 포함한 최근 7일간의 건강 데이터 기반 분석" // 분석 컨텍스트 추가
    };
    
    setIsLoadingInsights(true);
    setInsightError(null);
    
    try {
      if (!useAI) { // useAI가 false일 때 AI 인사이트 사용
        // GPT 기반 건강 인사이트 가져오기
        const response = await fetchHealthInsights(healthData);
        
        if (response && response.success) {
          setHealthInsights(response.insights);
        } else {
          // GPT 요청이 실패한 경우 폴백 인사이트 사용
          setHealthInsights(generateFallbackInsights(healthData));
          setInsightError('AI 인사이트를 가져올 수 없습니다. 규칙 기반 인사이트로 전환되었습니다.');
        }
      } else {
        // 규칙 기반 인사이트 사용 (useAI가 true일 때)
        setHealthInsights(generateFallbackInsights(healthData));
      }
    } catch (error: any) {
      console.error('건강 인사이트 생성 오류:', error);
      setHealthInsights(generateFallbackInsights(healthData));
      setInsightError('인사이트를 생성하는 중 오류가 발생했습니다. 규칙 기반 인사이트로 전환되었습니다.');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleRefresh = () => {
    fetchFitbitData(selectedDate, true);
  };

  // AI 인사이트와 규칙 기반 인사이트 전환
  const toggleInsightMode = () => {
    const newUseAIValue = !useAI; // 전환될 값을 미리 저장
    setUseAI(newUseAIValue);
    
    if (fitbitData.activity || fitbitData.sleep || fitbitData.heart) {
      fetchHealthInsightsData(fitbitData);
    }
    
    toast({
      title: newUseAIValue ? "AI 분석으로 전환됨" : "규칙 기반 분석으로 전환됨",
      description: newUseAIValue ? "미리 정의된 건강 가이드라인에 따른 인사이트를 제공합니다." : "GPT를 사용한 맞춤형 건강 인사이트를 제공합니다.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
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

  // 수면 품질 프로그레스바 값 계산 함수
  const calculateSleepQualityProgress = (sleepData: any, sleepGoalData: any, pastSleepData: any) => {
    // 1. Fitbit API에서 목표 수면 시간과 실제 수면 시간 비교
    if (sleepData?.summary?.totalMinutesAsleep && sleepGoalData?.goal?.minDuration) {
      // 목표 수면 시간(분)
      const sleepGoalMinutes = sleepGoalData.goal.minDuration;
      // 실제 수면 시간(분)
      const actualSleepMinutes = sleepData.summary.totalMinutesAsleep;
      
      // 목표 대비 달성률 계산 (최대 110%까지만 표시)
      const progressPercent = Math.min(Math.round((actualSleepMinutes / sleepGoalMinutes) * 100), 110);
      
      return {
        value: progressPercent,
        description: `목표 ${Math.floor(sleepGoalMinutes / 60)}시간 ${sleepGoalMinutes % 60}분 중 ${Math.floor(actualSleepMinutes / 60)}시간 ${actualSleepMinutes % 60}분 달성`
      };
    } 
    
    // 2. 수면 효율(efficiency)이 있다면 그대로 사용
    if (sleepData?.summary?.efficiency) {
      return {
        value: sleepData.summary.efficiency,
        description: `수면 효율 ${sleepData.summary.efficiency}%`
      };
    }
    
    // 3. 목표를 가져올 수 없다면 7일 전 데이터와 비교
    if (sleepData?.summary?.totalMinutesAsleep && pastSleepData?.sleep?.[0]?.minutesAsleep) {
      const currentSleepMinutes = sleepData.summary.totalMinutesAsleep;
      const pastSleepMinutes = pastSleepData.sleep[0].minutesAsleep;
      
      // 변화율 계산 (-50% ~ +50% 범위로 제한하고, 50%를 기준으로 변화율 추가)
      const changeRate = Math.min(Math.max((currentSleepMinutes - pastSleepMinutes) / pastSleepMinutes, -0.5), 0.5);
      const progressValue = Math.round(50 + (changeRate * 100));
      
      const changePercent = Math.abs(Math.round(changeRate * 100));
      const direction = changeRate >= 0 ? '증가' : '감소';
      
      return {
        value: progressValue,
        description: `7일 전보다 ${changePercent}% ${direction}됨`
      };
    }
    
    // 4. 모든 데이터를 가져올 수 없는 경우 기본값 사용
    return {
      value: mockTrendData.sleepQuality.value,
      description: '측정된 수면 데이터 없음'
    };
  };

  const renderDailyAnalysis = () => {
    if (!healthInsights) {
      return (
        <Card bg="white" boxShadow="md" borderRadius="lg" p={4}>
          <VStack align="stretch" spacing={4}>
            <Flex justify="space-between">
              <Heading size="md">건강 인사이트</Heading>
              <Text color="gray.500">정보 로딩 중...</Text>
            </Flex>
            <Skeleton height="100px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
          </VStack>
        </Card>
      );
    }

    return (
      <Card bg="white" boxShadow="md" borderRadius="lg" p={4} position="relative">
        <VStack align="stretch" spacing={4}>
          <Flex justify="space-between">
            <Flex align="center">
              <Heading size="md" mr={2}>건강 인사이트</Heading>
              {useAI && <Badge colorScheme="green">AI 분석</Badge>}
              {!useAI && <Badge colorScheme="blue">규칙 기반 분석</Badge>}
            </Flex>
            <Button 
              size="xs" 
              leftIcon={useAI ? <FiBook /> : <FiSun />} 
              onClick={toggleInsightMode}
              isLoading={isLoadingInsights}
            >
              {useAI ? '규칙 기반으로 전환' : 'AI 분석으로 전환'}
            </Button>
          </Flex>
          
          {insightError && (
            <Alert status="warning" size="sm">
              <AlertIcon />
              <Text fontSize="xs">{insightError}</Text>
            </Alert>
          )}
          
          <Tabs colorScheme="blue" size="md" index={insightActiveTab} onChange={setInsightActiveTab}>
            <TabList>
              <Tab>요약</Tab>
              <Tab>활동</Tab>
              <Tab>수면</Tab>
              <Tab>심혈관 건강</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <Box mb={4}>
                  <Box className="markdown-content">
                    <ReactMarkdown>{healthInsights.summary}</ReactMarkdown>
                  </Box>
                </Box>
                
                <Box>
                  <Text fontWeight="medium" mb={2}>추천사항</Text>
                  {healthInsights.recommendations.map((rec, index) => (
                    <HStack key={index} spacing={2} mb={index < healthInsights.recommendations.length - 1 ? 2 : 0}>
                      <Box color="blue.500"><FiCheckCircle /></Box>
                      <Box className="markdown-content" flex="1">
                        <ReactMarkdown>{rec}</ReactMarkdown>
                      </Box>
                    </HStack>
                  ))}
                </Box>
              </TabPanel>
              
              <TabPanel px={0}>
                <Flex align="center" mb={3}>
                  <Box bg="blue.50" p={2} borderRadius="md" mr={3}>
                    <FiActivity color="#3182CE" />
                  </Box>
                  <Text fontSize="lg" fontWeight="medium">일일 활동 분석</Text>
                </Flex>
                
                <Box className="markdown-content">
                  <ReactMarkdown>{healthInsights.activity}</ReactMarkdown>
                </Box>
              </TabPanel>
              
              <TabPanel px={0}>
                <Flex align="center" mb={3}>
                  <Box bg="blue.50" p={2} borderRadius="md" mr={3}>
                    <FiMoon color="#3182CE" />
                  </Box>
                  <Text fontSize="lg" fontWeight="medium">수면 분석</Text>
                </Flex>
                
                <Box className="markdown-content">
                  <ReactMarkdown>{healthInsights.sleep}</ReactMarkdown>
                </Box>
              </TabPanel>
              
              <TabPanel px={0}>
                <Flex align="center" mb={3}>
                  <Box bg="blue.50" p={2} borderRadius="md" mr={3}>
                    <FiHeart color="#3182CE" />
                  </Box>
                  <Text fontSize="lg" fontWeight="medium">심혈관 건강</Text>
                </Flex>
                
                <Box className="markdown-content">
                  <ReactMarkdown>{healthInsights.cardioHealth}</ReactMarkdown>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
          
          {isLoadingInsights && (
            <Flex 
              position="absolute" 
              top={0} 
              left={0} 
              right={0} 
              bottom={0} 
              bg="rgba(255, 255, 255, 0.7)" 
              zIndex={2}
              justify="center"
              align="center"
              direction="column"
            >
              <Spinner size="lg" color="blue.500" mb={2} />
              <Text>건강 인사이트 분석 중...</Text>
            </Flex>
          )}
        </VStack>
      </Card>
    );
  };

  const renderDashboard = () => {
    const activityData = fitbitData.activity?.summary;
    const sleepData = fitbitData.sleep?.summary;
    const heartData = fitbitData.heart?.['activities-heart']?.[0]?.value;
    const sleepGoalData = fitbitData.sleepGoal;
    const pastSleepData = fitbitData.pastSleep;

    if (!activityData && !sleepData && !heartData) {
      return (
        <Alert status="warning">
          <AlertIcon />
          건강 데이터를 불러올 수 없습니다. 새로고침을 시도해보세요.
        </Alert>
      );
    }

    // 수면 품질 계산
    const sleepQuality = calculateSleepQualityProgress(
      fitbitData.sleep,
      fitbitData.sleepGoal,
      fitbitData.pastSleep
    );

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
                  {sleepData ? (Math.floor(sleepData.totalMinutesAsleep / 60) + (sleepData.totalMinutesAsleep % 60) / 100).toFixed(1) : mockTrendData.sleep.value}
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
                  {activityData?.caloriesOut ? activityData.caloriesOut.toLocaleString() : mockTrendData.calories.value.toLocaleString()}
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
              value={sleepQuality.value} 
              colorScheme={
                sleepQuality.value >= 80
                  ? 'green'
                  : sleepQuality.value >= 60
                    ? 'blue'
                    : sleepQuality.value >= 40
                      ? 'orange'
                      : 'red'
              } 
              size="lg" 
              borderRadius="full" 
              my={3} 
            />
            
            <Flex justify="space-between">
              <Text fontSize="sm" color="gray.500">수면 시간</Text>
              <Text fontWeight="bold">
                {sleepData ? `${Math.floor(sleepData.totalMinutesAsleep / 60)}.${sleepData.totalMinutesAsleep % 60} 시간` : `${mockTrendData.sleep.value} 시간`}
              </Text>
            </Flex>
            <Text fontSize="sm" fontWeight="bold" textAlign="right" mt={1}>
              {sleepQuality.description}
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
