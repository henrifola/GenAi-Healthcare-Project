'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Tab,
  TabList,
  Tabs,
  Text,
  Avatar,
  AvatarGroup,
  SimpleGrid,
  Card,
  CardBody,
  Progress,
  IconButton,
  Icon,
  useToast,
  Container,
  Link,
} from '@chakra-ui/react';
import { FiSearch, FiUserPlus, FiAward, FiArrowLeft } from 'react-icons/fi';

// Dummy data - replace with API calls later
const dummyFriends = [
  {
    id: 1,
    name: 'Sarah Chen',
    steps: 12453,
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: 2,
    name: 'Mike Johnson',
    steps: 9876,
    avatar: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: 3,
    name: 'Emma Davis',
    steps: 8654,
    avatar: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: 4,
    name: 'Alex Kim',
    steps: 7890,
    avatar: 'https://i.pravatar.cc/150?img=4',
  },
  {
    id: 5,
    name: 'Lisa Park',
    steps: 6543,
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
];

const dummySearchResults = [
  { id: 6, name: 'John Smith', avatar: 'https://i.pravatar.cc/150?img=6' },
  { id: 7, name: 'Maria Garcia', avatar: 'https://i.pravatar.cc/150?img=7' },
];

// Add time-range specific data
const timeRangeData = {
  today: dummyFriends,
  week: [
    { ...dummyFriends[0], steps: 82453 },
    { ...dummyFriends[1], steps: 76890 },
    { ...dummyFriends[3], steps: 71234 }, // Alex moved up
    { ...dummyFriends[2], steps: 68654 },
    { ...dummyFriends[4], steps: 45678 },
  ],
  month: [
    { ...dummyFriends[1], steps: 342123 }, // Mike moved to first
    { ...dummyFriends[0], steps: 328654 },
    { ...dummyFriends[4], steps: 312890 }, // Lisa moved up
    { ...dummyFriends[2], steps: 298765 },
    { ...dummyFriends[3], steps: 287654 },
  ],
  year: [
    { ...dummyFriends[4], steps: 4123456 }, // Lisa moved to first
    { ...dummyFriends[1], steps: 3987654 },
    { ...dummyFriends[0], steps: 3876543 },
    { ...dummyFriends[2], steps: 3654321 },
    { ...dummyFriends[3], steps: 3543210 },
  ],
};

type TimeRange = 'today' | 'week' | 'month' | 'year';

interface SearchResult {
  id: number;
  name: string;
  avatar: string;
}

export default function SocialPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [showSearch, setShowSearch] = useState(false);
  const [friends, setFriends] = useState(timeRangeData.today);

  useEffect(() => {
    if (!session) {
      router.push('/login');
    }
  }, [session, router]);

  // Add effect to update friends when timeRange changes
  useEffect(() => {
    setFriends(timeRangeData[timeRange]);
  }, [timeRange]);

  if (!session) {
    return null;
  }

  const handleAddFriend = (friend: SearchResult) => {
    setFriends([
      ...friends,
      { ...friend, steps: Math.floor(Math.random() * 10000) },
    ]);
    setSearchQuery('');
    toast({
      title: 'Friend added!',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case 'today':
        return "Today's";
      case 'week':
        return "This Week's";
      case 'month':
        return "This Month's";
      case 'year':
        return "This Year's";
    }
  };

  const maxSteps = Math.max(...dummyFriends.map((f) => f.steps));

  return (
    <Container maxW="container.xl" p={4}>
      <VStack gap={8} align="stretch">
        <HStack justify="space-between">
          <HStack>
            <IconButton
              aria-label="Back to dashboard"
              icon={<FiArrowLeft />}
              variant="ghost"
              onClick={() => router.push('/dashboard')}
            />
            <Heading size="lg">Social Fitness</Heading>
          </HStack>
          <Button
            leftIcon={<Icon as={showSearch ? FiAward : FiSearch} />}
            onClick={() => setShowSearch(!showSearch)}
          >
            {showSearch ? 'View Rankings' : 'Find Friends'}
          </Button>
        </HStack>

        {showSearch ? (
          <Card>
            <CardBody>
              <VStack align="stretch" gap={6}>
                <Heading size="md">Find Friends</Heading>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FiSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>

                <VStack align="stretch" gap={4}>
                  {dummySearchResults.map((user) => (
                    <HStack key={user.id} justify="space-between">
                      <HStack>
                        <Avatar src={user.avatar} name={user.name} size="sm" />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">{user.name}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {user.id}@example.com
                          </Text>
                        </VStack>
                      </HStack>
                      <Button
                        size="sm"
                        leftIcon={<Icon as={FiUserPlus} />}
                        onClick={() => handleAddFriend(user)}
                      >
                        Add Friend
                      </Button>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <>
            <Card>
              <CardBody>
                <VStack align="stretch" gap={6}>
                  <HStack justify="space-between">
                    <Heading size="md">Your Friends</Heading>
                    <AvatarGroup size="sm" max={3}>
                      {dummyFriends.map((friend) => (
                        <Avatar
                          key={friend.id}
                          name={friend.name}
                          src={friend.avatar}
                        />
                      ))}
                    </AvatarGroup>
                  </HStack>

                  <Tabs
                    variant="soft-rounded"
                    colorScheme="brand"
                    onChange={(index) => {
                      setTimeRange(
                        ['today', 'week', 'month', 'year'][index] as TimeRange,
                      );
                    }}
                  >
                    <TabList>
                      <Tab>Today</Tab>
                      <Tab>Week</Tab>
                      <Tab>Month</Tab>
                      <Tab>Year</Tab>
                    </TabList>
                  </Tabs>

                  <VStack align="stretch" gap={4}>
                    <Heading size="sm">
                      {getTimeRangeLabel(timeRange)} Step Rankings
                    </Heading>
                    {friends
                      .sort((a, b) => b.steps - a.steps)
                      .map((friend, index) => (
                        <VStack key={friend.id} align="stretch" gap={2}>
                          <HStack justify="space-between">
                            <HStack>
                              {index < 3 && (
                                <Text
                                  fontSize="lg"
                                  color={
                                    index === 0
                                      ? 'yellow.400'
                                      : index === 1
                                        ? 'gray.400'
                                        : 'orange.400'
                                  }
                                >
                                  🏆
                                </Text>
                              )}
                              <Avatar
                                src={friend.avatar}
                                name={friend.name}
                                size="sm"
                              />
                              <Text fontWeight="medium">{friend.name}</Text>
                            </HStack>
                            <Text>{friend.steps.toLocaleString()} steps</Text>
                          </HStack>
                          <Progress
                            value={(friend.steps / maxSteps) * 100}
                            size="sm"
                            colorScheme={index === 0 ? 'brand' : 'gray'}
                            borderRadius="full"
                          />
                        </VStack>
                      ))}
                  </VStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Bottom Cards */}
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mt={8}>
              <Box
                bg="white"
                p={6}
                borderRadius="xl"
                boxShadow="sm"
                display="flex"
                flexDirection="column"
                height="100%"
              >
                <Heading size="lg" mb={4}>
                  Weekly Challenges
                </Heading>
                <Text color="gray.600" mb="auto">
                  Complete challenges with friends to earn badges and stay
                  motivated!
                </Text>
                <Button
                  as={Link}
                  href="/social/challenges"
                  colorScheme="blue"
                  size="lg"
                  mt={6}
                >
                  View Challenges
                </Button>
              </Box>

              <Box
                bg="white"
                p={6}
                borderRadius="xl"
                boxShadow="sm"
                display="flex"
                flexDirection="column"
                height="100%"
              >
                <Heading size="lg" mb={4}>
                  Group Activities
                </Heading>
                <Text color="gray.600" mb="auto">
                  Plan walks, runs, or workouts with your friends!
                </Text>
                <Button
                  as={Link}
                  href="/social/activities"
                  colorScheme="blue"
                  size="lg"
                  mt={6}
                >
                  Schedule Activity
                </Button>
              </Box>
            </SimpleGrid>
          </>
        )}
      </VStack>
    </Container>
  );
}
