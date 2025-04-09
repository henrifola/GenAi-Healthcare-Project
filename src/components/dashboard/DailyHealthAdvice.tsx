'use client';

import {
  Box,
  Text,
  VStack,
  Icon,
  Heading,
  HStack,
  Divider,
} from '@chakra-ui/react';
import { FiActivity } from 'react-icons/fi';

interface HealthData {
  heartRate: number;
  steps: number;
  sleepHours: number;
  caloriesBurned: number;
  activeMinutes: number;
  hrv: number;
  age: number;
  gender: 'male' | 'female';
}

interface DailyHealthAdviceProps {
  healthData: HealthData;
}

interface HealthInsight {
  title: string;
  mainInsight: string;
  recommendations: string[];
  icon: typeof FiActivity;
}

export const DailyHealthAdvice = ({ healthData }: DailyHealthAdviceProps) => {
  const generateInsights = (data: HealthData): HealthInsight[] => {
    const insights: HealthInsight[] = [
      {
        title: 'Daily Activity & Recovery',
        mainInsight: `You're doing well with ${data.steps.toLocaleString()} steps and ${data.sleepHours} hours of sleep, both of which support heart and overall health—just a bit more movement could help you hit the 10,000-step mark for optimal cardiovascular benefit. Keep an eye on your HRV (currently ${data.hrv} ms); while it's within a normal range, increasing it through mindfulness or light cardio can improve resilience to stress and overall recovery.`,
        icon: FiActivity,
        recommendations: [
          'Take a 10-minute walk during lunch to boost your step count',
          'Try deep breathing exercises before bed to improve HRV',
          'Maintain your consistent sleep schedule for optimal recovery',
        ],
      },
    ];

    return insights;
  };

  const insights = generateInsights(healthData);

  return (
    <Box
      p={6}
      bg="white"
      borderRadius="xl"
      boxShadow="0px 2px 4px rgba(0, 0, 0, 0.04)"
      transition="transform 0.2s"
      _hover={{ transform: 'translateY(-2px)' }}
    >
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between">
          <Heading size="md">Your Health Insights</Heading>
          <Text fontSize="sm" color="gray.500">
            Daily Analysis
          </Text>
        </HStack>

        {insights.map((insight, index) => (
          <VStack key={index} align="stretch" gap={6}>
            <HStack spacing={3}>
              <Box
                p={2}
                borderRadius="lg"
                bg="brand.50"
                color="brand.500"
                display="inline-flex"
              >
                <Icon as={insight.icon} boxSize={5} />
              </Box>
              <Text fontSize="lg" fontWeight="semibold" color="brand.600">
                {insight.title}
              </Text>
            </HStack>

            <Text color="gray.700" lineHeight="tall" fontSize="md">
              {insight.mainInsight}
            </Text>

            <Divider borderColor="gray.100" />

            <VStack align="stretch" gap={2}>
              <Text fontSize="sm" fontWeight="medium" color="gray.600">
                Recommendations
              </Text>
              {insight.recommendations.map((rec, idx) => (
                <HStack key={idx} spacing={3} align="start">
                  <Box
                    w={1.5}
                    h={1.5}
                    borderRadius="full"
                    bg="brand.500"
                    mt={2}
                  />
                  <Text fontSize="sm" color="gray.600">
                    {rec}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </VStack>
        ))}
      </VStack>
    </Box>
  );
};
