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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  List,
  ListItem,
  ListIcon,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
} from '@chakra-ui/react';
import {
  FiAward,
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiUsers,
  FiTrendingUp,
} from 'react-icons/fi';
import Link from 'next/link';
import { useState } from 'react';

interface Challenge {
  id: number;
  title: string;
  description: string;
  progress: number;
  participants: number;
  daysLeft: number;
  reward: string;
  dailyProgress?: {
    day: string;
    completed: number;
    target: number;
  }[];
  isJoined?: boolean;
}

// Dummy challenges data
const initialChallenges: Challenge[] = [
  {
    id: 1,
    title: '10K Steps Daily',
    description: 'Complete 10,000 steps every day this week',
    progress: 70,
    participants: 15,
    daysLeft: 3,
    reward: 'Gold Badge',
    dailyProgress: [
      { day: 'Monday', completed: 10000, target: 10000 },
      { day: 'Tuesday', completed: 8500, target: 10000 },
      { day: 'Wednesday', completed: 9200, target: 10000 },
      { day: 'Thursday', completed: 7800, target: 10000 },
    ],
    isJoined: true,
  },
  {
    id: 2,
    title: 'Early Bird',
    description: 'Track 7AM workout for 5 days',
    progress: 40,
    participants: 8,
    daysLeft: 4,
    reward: 'Silver Badge',
    dailyProgress: [
      { day: 'Monday', completed: 1, target: 1 },
      { day: 'Tuesday', completed: 1, target: 1 },
      { day: 'Wednesday', completed: 0, target: 1 },
      { day: 'Thursday', completed: 0, target: 1 },
    ],
    isJoined: true,
  },
  {
    id: 3,
    title: 'Sleep Master',
    description: 'Maintain 8 hours sleep schedule for a week',
    progress: 90,
    participants: 12,
    daysLeft: 2,
    reward: 'Gold Badge',
    dailyProgress: [
      { day: 'Monday', completed: 8.5, target: 8 },
      { day: 'Tuesday', completed: 8, target: 8 },
      { day: 'Wednesday', completed: 7.5, target: 8 },
      { day: 'Thursday', completed: 8.2, target: 8 },
    ],
    isJoined: true,
  },
  {
    id: 4,
    title: 'Weekend Warrior',
    description: 'Complete 15K steps on Saturday and Sunday',
    progress: 0,
    participants: 20,
    daysLeft: 5,
    reward: 'Premium Badge',
    dailyProgress: [],
    isJoined: false,
  },
];

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null,
  );
  const toast = useToast();

  const handleViewProgress = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    onOpen();
  };

  const handleJoinChallenge = (challengeId: number) => {
    setChallenges((prevChallenges) =>
      prevChallenges.map((challenge) =>
        challenge.id === challengeId
          ? {
              ...challenge,
              isJoined: true,
              participants: challenge.participants + 1,
              progress: 0,
              dailyProgress: [],
            }
          : challenge,
      ),
    );

    toast({
      title: 'Challenge Joined!',
      description: "You've successfully joined the challenge. Good luck!",
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleLeaveChallenge = (challengeId: number) => {
    setChallenges((prevChallenges) =>
      prevChallenges.map((challenge) =>
        challenge.id === challengeId
          ? {
              ...challenge,
              isJoined: false,
              participants: challenge.participants - 1,
              progress: 0,
              dailyProgress: [],
            }
          : challenge,
      ),
    );

    toast({
      title: 'Challenge Left',
      description: "You've left the challenge. Your progress has been reset.",
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    onClose();
  };

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

                <Button
                  colorScheme="blue"
                  variant={challenge.isJoined ? 'outline' : 'solid'}
                  onClick={() =>
                    challenge.isJoined
                      ? handleViewProgress(challenge)
                      : handleJoinChallenge(challenge.id)
                  }
                >
                  {challenge.isJoined ? 'View Progress' : 'Join Challenge'}
                </Button>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>

      {/* Progress Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedChallenge?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              <Text color="gray.600">{selectedChallenge?.description}</Text>

              <StatGroup>
                <Stat>
                  <StatLabel>Overall Progress</StatLabel>
                  <StatNumber>{selectedChallenge?.progress}%</StatNumber>
                  <StatHelpText>
                    <Icon as={FiTrendingUp} mr={1} />
                    Current completion rate
                  </StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Days Remaining</StatLabel>
                  <StatNumber>{selectedChallenge?.daysLeft}</StatNumber>
                  <StatHelpText>
                    <Icon as={FiClock} mr={1} />
                    Until challenge ends
                  </StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Participants</StatLabel>
                  <StatNumber>{selectedChallenge?.participants}</StatNumber>
                  <StatHelpText>
                    <Icon as={FiUsers} mr={1} />
                    People joined
                  </StatHelpText>
                </Stat>
              </StatGroup>

              <Box>
                <Heading size="sm" mb={4}>
                  Daily Progress
                </Heading>
                <List spacing={3}>
                  {selectedChallenge?.dailyProgress?.map((day, index) => (
                    <ListItem key={index}>
                      <HStack justify="space-between">
                        <HStack>
                          <ListIcon
                            as={FiCheck}
                            color={
                              day.completed >= day.target
                                ? 'green.500'
                                : 'gray.500'
                            }
                          />
                          <Text>{day.day}</Text>
                        </HStack>
                        <Text>
                          {day.completed} / {day.target}
                          {selectedChallenge.title.includes('Sleep')
                            ? ' hours'
                            : selectedChallenge.title.includes('Steps')
                              ? ' steps'
                              : ''}
                        </Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Box>
                <Heading size="sm" mb={2}>
                  Reward
                </Heading>
                <HStack>
                  <Icon as={FiAward} color="blue.500" />
                  <Text>{selectedChallenge?.reward}</Text>
                </HStack>
              </Box>

              <Button
                colorScheme="red"
                variant="outline"
                onClick={() =>
                  selectedChallenge &&
                  handleLeaveChallenge(selectedChallenge.id)
                }
                mt={4}
              >
                Leave Challenge
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}
