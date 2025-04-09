'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Button,
  Badge,
  VStack,
  HStack,
  Progress,
  Icon,
} from '@chakra-ui/react';
import { FiAward, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

// Dummy challenges data
const challenges = [
  {
    id: 1,
    title: '10K Steps Daily',
    description: 'Complete 10,000 steps every day this week',
    progress: 70,
    participants: 15,
    daysLeft: 3,
    reward: 'Gold Badge',
  },
  {
    id: 2,
    title: 'Early Bird',
    description: 'Track 7AM workout for 5 days',
    progress: 40,
    participants: 8,
    daysLeft: 4,
    reward: 'Silver Badge',
  },
  {
    id: 3,
    title: 'Sleep Master',
    description: 'Maintain 8 hours sleep schedule for a week',
    progress: 90,
    participants: 12,
    daysLeft: 2,
    reward: 'Gold Badge',
  },
  {
    id: 4,
    title: 'Weekend Warrior',
    description: 'Complete 15K steps on Saturday and Sunday',
    progress: 0,
    participants: 20,
    daysLeft: 5,
    reward: 'Premium Badge',
  },
];

export default function ChallengesPage() {
  return (
    <Container maxW="container.xl" p={4}>
      <VStack align="stretch" spacing={8}>
        <HStack>
          <Button
            as={Link}
            href="/social"
            variant="ghost"
            leftIcon={<FiArrowLeft />}
          >
            Back to Social
          </Button>
        </HStack>

        <Box>
          <Heading size="xl" mb={2}>
            Weekly Challenges
          </Heading>
          <Text color="gray.600" mb={8}>
            Join challenges, compete with friends, and earn badges!
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {challenges.map((challenge) => (
            <Box
              key={challenge.id}
              bg="white"
              p={6}
              borderRadius="xl"
              boxShadow="sm"
            >
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between">
                  <Heading size="md">{challenge.title}</Heading>
                  <Icon as={FiAward} color="blue.500" boxSize={6} />
                </HStack>

                <Text color="gray.600">{challenge.description}</Text>

                <Progress
                  value={challenge.progress}
                  colorScheme="blue"
                  borderRadius="full"
                />

                <HStack justify="space-between">
                  <Badge colorScheme="blue">
                    {challenge.participants} Participants
                  </Badge>
                  <Badge
                    colorScheme={challenge.daysLeft <= 2 ? 'red' : 'green'}
                  >
                    {challenge.daysLeft} days left
                  </Badge>
                </HStack>

                <Button colorScheme="blue">
                  {challenge.progress === 0
                    ? 'Join Challenge'
                    : 'View Progress'}
                </Button>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
}
