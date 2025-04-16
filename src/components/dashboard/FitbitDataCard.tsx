'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  TabList,
  Tabs,
  Tab,
  TabPanels,
  TabPanel
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
  FiZap // FiFire 대신 FiZap으로 변경
} from 'react-icons/fi';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

interface FitbitData {
  profile?: any;
  activity?: any;
  sleep?: any;
  heart?: any;
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
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(5 * 60 * 1000); // 5분으로 기본 설정
  const [activeTab, setActiveTab] = useState(0);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Record<string, number>>({});

  // 캐시 제한 시간 (5분)
  const CACHE_TIMEOUT = 5 * 60 * 1000;

  const fetchFitbitData = useCallback(async (date: string = 'today', force: boolean = false) => {
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

    // 캐시 체크 (강제 요청이 아닌 경우)
    if (!force && lastFetchTime[date]) {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime[date];
      
      // 캐시 유효 시간 내라면 API 요청 스킵
      if (timeSinceLastFetch < CACHE_TIMEOUT) {
        console.log(`캐시된 데이터 사용 중... 날짜: ${date}, 마지막 요청: ${Math.round(timeSinceLastFetch / 1000)}초 전`);
        return;
      }
    }

    try {
      setFitbitData(prev => ({ ...prev, loading: true, error: null }));
      
      console.log(`Fitbit 데이터 요청 중... 날짜: ${date}`);
      const response = await fetch(`/api/fitbit/user-data?date=${date}&type=all`);
      
      // API 요청 한도 초과 오류 특별 처리
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
      
      const data = await response.json();
      console.log('Fitbit 데이터 수신:', Object.keys(data));
      
      // 캐시 시간 업데이트
      setLastFetchTime(prev => ({
        ...prev,
        [date]: Date.now()
      }));
      
      // 일부 데이터만 받아와도 표시 (가능한 정보만이라도 보여주기)
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
      
      // 요청 한도 초과 오류인 경우 특별 처리
      const isRateLimitError = error.message && (
        error.message.includes('429') || 
        error.message.includes('Too Many Requests') || 
        error.message.includes('요청 한도')
      );
      
      setFitbitData(prev => ({
        ...prev,
        loading: false,
        error: error.message || '데이터를 불러오는데 문제가 발생했습니다',
        // 429 오류가 발생해도 기존 데이터는 유지
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
        
        // 요청 한도 초과 시 자동 새로고침 일시 중지
        if (isRateLimitError) {
          setIsAutoRefresh(false);
        }
      }
      
      return null;
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

  const handleTabChange = (index: number) => {
    setActiveTab(index);
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
    if (session?.accessToken) {
      fetchFitbitData(selectedDate);
    }
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

  const activityData = fitbitData.activity?.summary;
  const sleepData = fitbitData.sleep?.summary;
  const heartData = fitbitData.heart?.['activities-heart']?.[0]?.value;

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

          <Tabs isFitted variant="enclosed" onChange={handleTabChange} index={activeTab}>
            <TabList mb="1em">
              <Tab>활동 요약</Tab>
              <Tab>수면</Tab>
              <Tab>심박수</Tab>
            </TabList>
            <TabPanels>
              <TabPanel p={0} pt={4}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  {activityData ? (
                    <>
                      <Stat>
                        <StatLabel display="flex" alignItems="center">
                          <FiActivity style={{ marginRight: '8px' }} /> 걸음 수
                        </StatLabel>
                        <StatNumber>{activityData.steps?.toLocaleString() || '0'}</StatNumber>
                        <StatHelpText>목표: 10,000 걸음</StatHelpText>
                        <Progress 
                          value={((activityData.steps || 0) / 10000) * 100} 
                          colorScheme="blue" 
                          size="sm"
                        />
                      </Stat>
                      
                      <Stat>
                        <StatLabel display="flex" alignItems="center">
                          <FiTrendingUp style={{ marginRight: '8px' }} /> 이동 거리
                        </StatLabel>
                        <StatNumber>{(activityData.distances?.[0]?.distance || 0).toFixed(2)}</StatNumber>
                        <StatHelpText>킬로미터</StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel display="flex" alignItems="center">
                          <FiZap style={{ marginRight: '8px' }} /> 칼로리
                        </StatLabel>
                        <StatNumber>{(activityData.caloriesOut || 0).toLocaleString()}</StatNumber>
                        <StatHelpText>소모 칼로리</StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel display="flex" alignItems="center">
                          <FiDribbble style={{ marginRight: '8px' }} /> 활동 시간
                        </StatLabel>
                        <StatNumber>
                          {((activityData.fairlyActiveMinutes || 0) + (activityData.veryActiveMinutes || 0))}
                        </StatNumber>
                        <StatHelpText>분</StatHelpText>
                        <HStack spacing={2} mt={1}>
                          <Badge colorScheme="green">매우 활발: {activityData.veryActiveMinutes || 0}분</Badge>
                          <Badge colorScheme="blue">활발: {activityData.fairlyActiveMinutes || 0}분</Badge>
                        </HStack>
                      </Stat>
                    </>
                  ) : (
                    <Box gridColumn={{ base: "span 1", md: "span 3" }}>
                      <Alert status="warning">
                        <AlertIcon />
                        활동 데이터를 불러올 수 없습니다.
                      </Alert>
                    </Box>
                  )}
                </SimpleGrid>
              </TabPanel>
              
              <TabPanel p={0} pt={4}>
                {sleepData ? (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Stat>
                      <StatLabel display="flex" alignItems="center">
                        <FiClock style={{ marginRight: '8px' }} /> 수면 시간
                      </StatLabel>
                      <StatNumber>
                        {Math.floor((sleepData.totalTimeInBed || 0) / 60)}시간 
                        {(sleepData.totalTimeInBed || 0) % 60}분
                      </StatNumber>
                      <StatHelpText>침대에서 보낸 총 시간</StatHelpText>
                      <Progress 
                        value={(sleepData.totalTimeInBed / 480) * 100}
                        colorScheme="purple" 
                        size="sm"
                      />
                    </Stat>
                    
                    <Stat>
                      <StatLabel display="flex" alignItems="center">
                        <FiActivity style={{ marginRight: '8px' }} /> 수면 효율
                      </StatLabel>
                      <StatNumber>{sleepData.efficiency || 0}%</StatNumber>
                      <StatHelpText>실제 수면 시간 / 침대에서 보낸 시간</StatHelpText>
                      <Progress 
                        value={sleepData.efficiency || 0} 
                        colorScheme={sleepData.efficiency > 85 ? "green" : sleepData.efficiency > 70 ? "blue" : "orange"} 
                        size="sm"
                      />
                    </Stat>
                    
                    {sleepData.stages && (
                      <Box gridColumn={{ md: "span 2" }}>
                        <Text fontWeight="bold" mb={2}>수면 단계</Text>
                        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                          <Stat>
                            <StatLabel>깊은 수면</StatLabel>
                            <StatNumber>{Math.floor((sleepData.stages.deep || 0) / 60)}시간 {(sleepData.stages.deep || 0) % 60}분</StatNumber>
                            <Progress value={(sleepData.stages.deep / sleepData.totalMinutesAsleep) * 100} colorScheme="blue" size="sm" />
                          </Stat>
                          <Stat>
                            <StatLabel>얕은 수면</StatLabel>
                            <StatNumber>{Math.floor((sleepData.stages.light || 0) / 60)}시간 {(sleepData.stages.light || 0) % 60}분</StatNumber>
                            <Progress value={(sleepData.stages.light / sleepData.totalMinutesAsleep) * 100} colorScheme="cyan" size="sm" />
                          </Stat>
                          <Stat>
                            <StatLabel>렘 수면</StatLabel>
                            <StatNumber>{Math.floor((sleepData.stages.rem || 0) / 60)}시간 {(sleepData.stages.rem || 0) % 60}분</StatNumber>
                            <Progress value={(sleepData.stages.rem / sleepData.totalMinutesAsleep) * 100} colorScheme="purple" size="sm" />
                          </Stat>
                          <Stat>
                            <StatLabel>깨어 있음</StatLabel>
                            <StatNumber>{Math.floor((sleepData.stages.wake || 0) / 60)}시간 {(sleepData.stages.wake || 0) % 60}분</StatNumber>
                            <Progress value={(sleepData.stages.wake / sleepData.totalMinutesAsleep) * 100} colorScheme="gray" size="sm" />
                          </Stat>
                        </SimpleGrid>
                      </Box>
                    )}
                  </SimpleGrid>
                ) : (
                  <Alert status="warning">
                    <AlertIcon />
                    수면 데이터를 불러올 수 없습니다.
                  </Alert>
                )}
              </TabPanel>
              
              <TabPanel p={0} pt={4}>
                {heartData ? (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Stat>
                      <StatLabel display="flex" alignItems="center">
                        <FiHeart style={{ marginRight: '8px' }} /> 안정 시 심박수
                      </StatLabel>
                      <StatNumber>{heartData.restingHeartRate || '-'}</StatNumber>
                      <StatHelpText>bpm</StatHelpText>
                      <Box mt={2}>
                        {heartData.restingHeartRate > 100 ? (
                          <Badge colorScheme="orange" display="flex" alignItems="center">
                            <FiAlertCircle style={{ marginRight: '4px' }} /> 높음
                          </Badge>
                        ) : heartData.restingHeartRate < 60 ? (
                          <Badge colorScheme="green">낮음</Badge>
                        ) : (
                          <Badge colorScheme="blue">정상</Badge>
                        )}
                      </Box>
                    </Stat>
                    
                    {heartData.heartRateZones && (
                      <Box gridColumn={{ md: "span 2" }}>
                        <Text fontWeight="bold" mb={2}>심박수 구간</Text>
                        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                          {heartData.heartRateZones.map((zone: any, index: number) => (
                            <Stat key={index}>
                              <StatLabel>{zone.name}</StatLabel>
                              <StatNumber>{zone.minutes || 0}</StatNumber>
                              <StatHelpText>분</StatHelpText>
                              <Text fontSize="xs">
                                {zone.min || 0} - {zone.max || '--'} bpm
                              </Text>
                            </Stat>
                          ))}
                        </SimpleGrid>
                      </Box>
                    )}
                  </SimpleGrid>
                ) : (
                  <Alert status="warning">
                    <AlertIcon />
                    심박수 데이터를 불러올 수 없습니다.
                  </Alert>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
          
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