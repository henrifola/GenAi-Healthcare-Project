import {
  Box,
  VStack,
  Text,
  HStack,
  Progress,
  Badge,
  Icon,
  Button,
  useColorModeValue,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FaTrophy, FaFire, FaMedal, FaCalendarCheck, FaUsers, FaWalking } from 'react-icons/fa';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'event';
  progress: number;
  goal: number;
  reward: string;
  endTime?: string;
  participants?: number;
  icon: typeof FaTrophy;
}

const pixelFontStyle = {
  fontFamily: "var(--font-press-start)",
};

const challenges: Challenge[] = [
  {
    id: 'daily-1',
    title: '친구 경쟁자 이기기',
    description: '오늘 친구 2명보다 더 많이 걷기',
    type: 'daily',
    progress: 8500,
    goal: 10000,
    reward: '골드 뱃지',
    icon: FaUsers,
  },
  {
    id: 'daily-2',
    title: '아침 산책',
    description: '오전 9시 전에 3000보 달성',
    type: 'daily',
    progress: 2000,
    goal: 3000,
    reward: '실버 뱃지',
    icon: FaWalking,
  },
  {
    id: 'weekly-1',
    title: '꾸준한 걸음',
    description: '5일 연속 7,000보 달성',
    type: 'weekly',
    progress: 3,
    goal: 5,
    reward: '플래티넘 뱃지',
    endTime: '4일 남음',
    icon: FaFire,
  },
  {
    id: 'weekly-2',
    title: '주간 챔피언',
    description: '이번 주 총 걸음 수 70,000보 달성',
    type: 'weekly',
    progress: 45000,
    goal: 70000,
    reward: '골드 트로피',
    endTime: '4일 남음',
    icon: FaTrophy,
  },
  {
    id: 'event-1',
    title: '봄맞이 걷기 대회',
    description: '친구들과 함께 참여하는 봄 시즌 이벤트',
    type: 'event',
    progress: 15000,
    goal: 100000,
    reward: '한정판 봄 뱃지',
    endTime: '14일 남음',
    participants: 128,
    icon: FaCalendarCheck,
  },
];

const ChallengeCard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const borderColor = useColorModeValue('purple.500', 'purple.400');
  const bgGlow = useColorModeValue('rgba(147, 51, 234, 0.1)', 'rgba(147, 51, 234, 0.2)');

  const renderChallenge = (challenge: Challenge) => (
    <Box
      key={challenge.id}
      p={4}
      borderRadius="lg"
      bg="whiteAlpha.50"
      border="2px solid"
      borderColor={borderColor}
      position="relative"
      transition="all 0.3s"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: '0 0 20px rgba(147, 51, 234, 0.3)',
        bg: bgGlow,
      }}
      role="group"
    >
      <HStack spacing={4} mb={3}>
        <Icon
          as={challenge.icon}
          w={6}
          h={6}
          color="purple.300"
          filter="drop-shadow(0 0 5px currentColor)"
        />
        <VStack align="start" spacing={0} flex={1}>
          <Text
            sx={pixelFontStyle}
            fontSize="xs"
            color="purple.300"
            fontWeight="bold"
          >
            {challenge.title}
          </Text>
          <Text fontSize="xs" color="whiteAlpha.700">
            {challenge.description}
          </Text>
        </VStack>
        <Badge
          colorScheme="purple"
          variant="solid"
          sx={pixelFontStyle}
          fontSize="2xs"
        >
          {challenge.reward}
        </Badge>
      </HStack>

      <Box w="100%" mb={2}>
        <Progress
          value={(challenge.progress / challenge.goal) * 100}
          size="sm"
          borderRadius="full"
          bg="whiteAlpha.100"
          sx={{
            '& > div': {
              background: 'linear-gradient(90deg, #9F7AEA, #805AD5)',
              boxShadow: '0 0 10px rgba(159, 122, 234, 0.5)',
            }
          }}
        />
      </Box>

      <HStack justify="space-between" fontSize="xs">
        <Text color="whiteAlpha.700">
          {challenge.progress.toLocaleString()} / {challenge.goal.toLocaleString()}
          {challenge.type === 'weekly' && challenge.progress <= 7 ? '일' : '보'}
        </Text>
        <HStack spacing={3}>
          {challenge.participants && (
            <Text color="purple.300">
              <Icon as={FaUsers} mr={1} />
              {challenge.participants}명
            </Text>
          )}
          {challenge.endTime && (
            <Text color="pink.300">
              {challenge.endTime}
            </Text>
          )}
        </HStack>
      </HStack>
    </Box>
  );

  return (
    <Box>
      <Text
        sx={pixelFontStyle}
        fontSize="xl"
        fontWeight="bold"
        mb={6}
        color="pink.300"
        textShadow="0 0 10px #e60073"
      >
        CHALLENGES 🏆
      </Text>

      <Tabs
        variant="soft-rounded"
        colorScheme="purple"
        onChange={setActiveTab}
        mb={6}
      >
        <TabList mb={4}>
          <Tab
            sx={pixelFontStyle}
            fontSize="xs"
            _selected={{ color: 'white', bg: 'purple.500' }}
          >
            일일
          </Tab>
          <Tab
            sx={pixelFontStyle}
            fontSize="xs"
            _selected={{ color: 'white', bg: 'purple.500' }}
          >
            주간
          </Tab>
          <Tab
            sx={pixelFontStyle}
            fontSize="xs"
            _selected={{ color: 'white', bg: 'purple.500' }}
          >
            이벤트
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel p={0}>
            <VStack spacing={4}>
              {challenges.filter(c => c.type === 'daily').map(renderChallenge)}
            </VStack>
          </TabPanel>
          <TabPanel p={0}>
            <VStack spacing={4}>
              {challenges.filter(c => c.type === 'weekly').map(renderChallenge)}
            </VStack>
          </TabPanel>
          <TabPanel p={0}>
            <VStack spacing={4}>
              {challenges.filter(c => c.type === 'event').map(renderChallenge)}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Button
        w="100%"
        colorScheme="purple"
        sx={pixelFontStyle}
        fontSize="xs"
        leftIcon={<Icon as={FaTrophy} />}
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: '0 0 20px rgba(147, 51, 234, 0.3)',
        }}
      >
        새로운 챌린지 만들기
      </Button>
    </Box>
  );
};

export default ChallengeCard; 