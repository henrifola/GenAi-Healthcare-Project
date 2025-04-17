'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Avatar,
  Button,
  Flex,
} from '@chakra-ui/react';
import { FiLogOut } from 'react-icons/fi';
import FitbitDataCard from '@/components/dashboard/FitbitDataCard';
import FitbitHistoryCard from '@/components/dashboard/FitbitHistoryCard';
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
        
        {/* Fitbit History Card */}
        <FitbitHistoryCard limit={30} />
      </VStack>
    </Box>
  );
}
