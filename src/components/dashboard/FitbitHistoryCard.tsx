'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  Select,
  Flex,
  Button,
  useToast,
  ButtonGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Progress,
  VStack,
} from '@chakra-ui/react';
import { FiCalendar, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { format, subDays, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface HistoryItem {
  id: string;
  date: string;
  steps: number;
  calories: number;
  activeMinutes: number;
  restingHeartRate?: number;
  sleepDuration?: number;
  sleepEfficiency?: number;
  createdAt: string;
}

interface FitbitHistoryCardProps {
  limit?: number;
}

const FitbitHistoryCard: React.FC<FitbitHistoryCardProps> = ({ limit = 30 }) => {
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('7days');
  const [isPreloadModalOpen, setIsPreloadModalOpen] = useState(false);
  const [preloadMonths, setPreloadMonths] = useState<number>(1);
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [preloadStatus, setPreloadStatus] = useState<{
    processed: number;
    succeeded: number;
    failed: number;
    totalDays: number;
  }>({ processed: 0, succeeded: 0, failed: 0, totalDays: 0 });
  const toast = useToast();

  // 데이터 불러오기
  const fetchHistoryData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let startDate;
      let endDate = format(new Date(), 'yyyy-MM-dd'); // 오늘 날짜
      
      // 기간 설정
      switch (timeRange) {
        case '7days':
          startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd'); // 7일 전부터
          break;
        case '14days':
          startDate = format(subDays(new Date(), 13), 'yyyy-MM-dd'); // 14일 전부터
          break;
        case '30days':
          startDate = format(subDays(new Date(), 29), 'yyyy-MM-dd'); // 30일 전부터
          break;
        case '90days':
          startDate = format(subDays(new Date(), 89), 'yyyy-MM-dd'); // 90일 전부터
          break;
        default:
          startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd');
      }
      
      // API 요청
      const response = await fetch(`/api/fitbit/history?startDate=${startDate}&endDate=${endDate}&limit=${limit}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '히스토리 데이터를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setHistoryData(data.data);
    } catch (err: any) {
      setError(err.message || '데이터를 불러오는데 문제가 발생했습니다.');
      toast({
        title: '데이터 로딩 실패',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 데이터 사전 로드 처리
  const handlePreloadData = async () => {
    setIsPreloading(true);
    setPreloadProgress(0);
    setPreloadStatus({ processed: 0, succeeded: 0, failed: 0, totalDays: 0 });
    
    try {
      const response = await fetch('/api/fitbit/history/preload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ months: preloadMonths }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '데이터 사전 로드에 실패했습니다.');
      }

      const result = await response.json();
      
      // 결과 업데이트
      setPreloadStatus({
        processed: result.results.processed,
        succeeded: result.results.succeeded,
        failed: result.results.failed,
        totalDays: result.results.totalDays,
      });
      
      setPreloadProgress(100);
      
      toast({
        title: '데이터 사전 로드 완료',
        description: `${result.results.succeeded}개의 데이터가 성공적으로 로드되었습니다.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // 현재 선택된 기간에 해당하는 데이터 다시 불러오기
      fetchHistoryData();
      
    } catch (err: any) {
      toast({
        title: '데이터 사전 로드 실패',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsPreloading(false);
    }
  };

  // 컴포넌트 마운트 시 및 시간 범위 변경 시 데이터 불러오기
  useEffect(() => {
    fetchHistoryData();
  }, [timeRange]);

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'yyyy년 MM월 dd일', { locale: ko });
    } catch {
      try {
        // YYYY-MM-DD 형식 처리
        return format(new Date(dateString), 'yyyy년 MM월 dd일', { locale: ko });
      } catch {
        return dateString;
      }
    }
  };

  // 데이터가 유효한지 확인하는 함수 (실제 활동이 있는지)
  const isValidData = (item: HistoryItem) => {
    // 4월 10일 이전에는 모두 1,737 칼로리로 표시되는 가짜 데이터 필터링
    if (item.date < '2025-04-10' && item.calories === 1737 && item.steps === 0) {
      return false;
    }
    
    // 실제 활동 데이터가 있는지 확인 (걸음 수나 심박수 등이 있으면 유효한 데이터로 간주)
    return item.steps > 0 || item.activeMinutes > 0 || 
           item.restingHeartRate !== undefined || 
           item.sleepDuration !== undefined;
  };

  // 유효한 데이터만 필터링
  const validHistoryData = historyData.filter(isValidData);

  return (
    <>
      <Card boxShadow="md" borderRadius="lg" mt={6}>
        <CardHeader>
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
            <Heading size="md">Fitbit 건강 데이터 히스토리</Heading>
            <Flex align="center" gap={3} flexWrap="wrap">
              <FiCalendar />
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                size="sm"
                width="150px"
              >
                <option value="7days">최근 7일</option>
                <option value="14days">최근 14일</option>
                <option value="30days">최근 30일</option>
                <option value="90days">최근 90일</option>
              </Select>
              <ButtonGroup size="sm">
                <Button onClick={fetchHistoryData} colorScheme="blue" leftIcon={<FiRefreshCw />}>
                  새로고침
                </Button>
                <Button 
                  onClick={() => setIsPreloadModalOpen(true)} 
                  colorScheme="teal" 
                  leftIcon={<FiDownload />}
                >
                  이전 데이터 가져오기
                </Button>
              </ButtonGroup>
            </Flex>
          </Flex>
        </CardHeader>
        
        <CardBody>
          {isLoading ? (
            <Flex justify="center" p={10}>
              <Spinner size="xl" colorScheme="blue" />
            </Flex>
          ) : error ? (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          ) : validHistoryData.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              저장된 히스토리 데이터가 없습니다. '이전 데이터 가져오기' 버튼을 클릭하여 데이터를 불러오세요.
            </Alert>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>날짜</Th>
                    <Th isNumeric>걸음 수</Th>
                    <Th isNumeric>칼로리</Th>
                    <Th isNumeric>활동 시간(분)</Th>
                    <Th isNumeric>심박수(bpm)</Th>
                    <Th isNumeric>수면 시간</Th>
                    <Th isNumeric>수면 효율</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {validHistoryData.map((item) => (
                    <Tr key={item.id}>
                      <Td>{formatDate(item.date)}</Td>
                      <Td isNumeric>{item.steps.toLocaleString()}</Td>
                      <Td isNumeric>{item.calories.toLocaleString()}</Td>
                      <Td isNumeric>{item.activeMinutes}</Td>
                      <Td isNumeric>{item.restingHeartRate || '-'}</Td>
                      <Td isNumeric>
                        {item.sleepDuration 
                          ? `${Math.floor(item.sleepDuration)}시간 ${Math.round((item.sleepDuration % 1) * 60)}분` 
                          : '-'}
                      </Td>
                      <Td isNumeric>
                        {item.sleepEfficiency ? `${item.sleepEfficiency}%` : '-'}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
          
          <Text fontSize="xs" color="gray.500" mt={4}>
            * 데이터는 Fitbit 기기에서 수집된 정보를 기반으로 합니다.
          </Text>
        </CardBody>
      </Card>

      {/* 이전 데이터 가져오기 모달 */}
      <Modal isOpen={isPreloadModalOpen} onClose={() => !isPreloading && setIsPreloadModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>이전 Fitbit 데이터 가져오기</ModalHeader>
          {!isPreloading && <ModalCloseButton />}
          <ModalBody>
            {!isPreloading ? (
              <>
                <Text mb={4}>
                  선택한 기간 동안의 Fitbit 데이터를 미리 가져와 데이터베이스에 저장합니다.
                  이렇게 하면 나중에 히스토리 데이터를 더 빠르게 조회할 수 있습니다.
                </Text>
                <Select 
                  value={preloadMonths} 
                  onChange={(e) => setPreloadMonths(Number(e.target.value))}
                  mb={4}
                >
                  <option value={1}>최근 1개월</option>
                  <option value={2}>최근 2개월</option>
                  <option value={6}>최근 6개월</option>
                  <option value={12}>최근 12개월</option>
                </Select>
                <Alert status="warning" size="sm">
                  <AlertIcon />
                  <Text fontSize="sm">
                    선택한 기간이 길수록 처리 시간이 오래 걸릴 수 있습니다.
                  </Text>
                </Alert>
              </>
            ) : (
              <VStack spacing={4} align="stretch">
                <Text>데이터를 가져오는 중입니다. 잠시만 기다려주세요...</Text>
                <Progress
                  hasStripe
                  isAnimated
                  value={(preloadStatus.processed / preloadStatus.totalDays) * 100}
                  mb={2}
                />
                <Text fontSize="sm">
                  {preloadStatus.totalDays > 0 ? (
                    <>
                      처리 중: {preloadStatus.processed}/{preloadStatus.totalDays} 일 
                      ({((preloadStatus.processed / preloadStatus.totalDays) * 100).toFixed(1)}%)
                    </>
                  ) : (
                    '처리 중...'
                  )}
                </Text>
                {preloadStatus.processed > 0 && (
                  <>
                    <Text fontSize="sm" color="green.500">성공: {preloadStatus.succeeded}일</Text>
                    {preloadStatus.failed > 0 && (
                      <Text fontSize="sm" color="red.500">실패: {preloadStatus.failed}일</Text>
                    )}
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            {!isPreloading ? (
              <>
                <Button variant="ghost" mr={3} onClick={() => setIsPreloadModalOpen(false)}>
                  취소
                </Button>
                <Button colorScheme="blue" onClick={handlePreloadData}>
                  데이터 가져오기
                </Button>
              </>
            ) : (
              <Button isDisabled={true}>
                처리 중...
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default FitbitHistoryCard;