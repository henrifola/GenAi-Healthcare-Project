'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  SimpleGrid,
  HStack,
  Avatar,
  Button,
  Flex,
} from '@chakra-ui/react';
import {
  FiHeart,
  FiActivity,
  FiTrendingUp,
  FiMoon,
  FiZap,
  FiClock as FiActivity2,
  FiLogOut,
} from 'react-icons/fi';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SleepQualityCard } from '@/components/dashboard/SleepQualityCard';
import { DailyHealthAdvice } from '@/components/dashboard/DailyHealthAdvice';
import FitbitDataCard from '@/components/dashboard/FitbitDataCard';
import { HealthMetrics } from '@/types/dashboard';

// Dummy user data
const dummyUser = {
  name: 'Sarah Chen',
  email: 'sarah.chen@example.com',
  avatar: 'https://i.pravatar.cc/150?img=1',
};

// Dummy data - these would come from props or API calls later
const dummyMetrics: HealthMetrics = {
  heartRate: 72,
  steps: 8456,
  sleepHours: 7.5,
  caloriesBurned: 450,
  activeMinutes: 45,
  hrv: 45, // Heart Rate Variability in ms
};

// Dummy trend data (comparing with previous day)
const dummyTrendChanges = {
  heartRate: -2, // Lower heart rate is generally good
  steps: 12,
  sleep: 5,
  calories: -3,
  activeMinutes: 5,
  hrv: 5,
};

// Extended health data for AI analysis
const healthData = {
  ...dummyMetrics,
  age: 32,
  gender: 'female' as const,
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push('/');
    }
  }, [session, router]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  if (!session) {
    return null;
  }

  return (
    <Box p={8}>
      <VStack gap={8} align="stretch">
        <Flex justify="space-between" align="center">
          <HStack spacing={4}>
            <Avatar
              src={dummyUser.avatar}
              name={dummyUser.name}
              size="lg"
              boxShadow="md"
            />
            <Heading>Welcome back, {session.user?.name || dummyUser.name}</Heading>
          </HStack>
          <Button
            leftIcon={<FiLogOut />}
            onClick={handleLogout}
            colorScheme="red"
            variant="ghost"
            size="md"
          >
            Log Out
          </Button>
        </Flex>

        {/* Fitbit Data Card */}
        <FitbitDataCard />

        {/* Health Insights */}
        <DailyHealthAdvice healthData={healthData} />

        {/* Health Metrics Overview */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
          <MetricCard
            icon={FiHeart}
            label="Heart Rate"
            value={dummyMetrics.heartRate}
            unit="bpm"
            change={dummyTrendChanges.heartRate}
          />
          <MetricCard
            icon={FiActivity}
            label="Steps"
            value={dummyMetrics.steps}
            change={dummyTrendChanges.steps}
            showCompare
          />
          <MetricCard
            icon={FiMoon}
            label="Sleep"
            value={dummyMetrics.sleepHours}
            unit="hrs"
            change={dummyTrendChanges.sleep}
          />
          <MetricCard
            icon={FiTrendingUp}
            label="Calories"
            value={dummyMetrics.caloriesBurned}
            unit="kcal"
            change={dummyTrendChanges.calories}
          />
        </SimpleGrid>

        {/* Activity Trends */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <MetricCard
            icon={FiActivity2}
            label="Active Minutes"
            value={dummyMetrics.activeMinutes}
            unit="min"
            change={dummyTrendChanges.activeMinutes}
          />
          <MetricCard
            icon={FiZap}
            label="HRV"
            value={dummyMetrics.hrv}
            unit="ms"
            change={dummyTrendChanges.hrv}
          />
        </SimpleGrid>

        {/* Sleep Quality */}
        <SleepQualityCard hours={dummyMetrics.sleepHours} quality={75} />
      </VStack>
    </Box>
  );
}
