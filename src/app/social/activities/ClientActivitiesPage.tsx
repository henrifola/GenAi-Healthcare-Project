'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Button,
  VStack,
  HStack,
  Icon,
  Avatar,
  AvatarGroup,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiPlus,
} from 'react-icons/fi';

interface Activity {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  participants: Array<{
    id: string;
    name: string;
    avatar: string;
  }>;
  maxParticipants: number;
  type: string;
  ownerId: string;
}

export default function ClientActivitiesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      title: 'Morning Yoga Session',
      description: 'Start your day with a peaceful yoga session in the park.',
      date: '2024-03-20',
      time: '07:00',
      location: 'Central Park',
      participants: [
        {
          id: '1',
          name: 'Sarah Johnson',
          avatar: 'https://i.pravatar.cc/150?img=1',
        },
        {
          id: '2',
          name: 'Mike Wilson',
          avatar: 'https://i.pravatar.cc/150?img=2',
        },
      ],
      maxParticipants: 10,
      type: 'Yoga',
      ownerId: '1',
    },
    {
      id: '2',
      title: 'Evening Running Group',
      description:
        'Join our weekly running group for a 5K run around the city.',
      date: '2024-03-21',
      time: '18:00',
      location: 'City Center',
      participants: [
        {
          id: '3',
          name: 'Emma Davis',
          avatar: 'https://i.pravatar.cc/150?img=3',
        },
      ],
      maxParticipants: 15,
      type: 'Running',
      ownerId: '3',
    },
  ]);

  const [newActivity, setNewActivity] = useState({
    title: '',
    type: '',
    date: '',
    time: '',
    location: '',
    maxParticipants: '',
    description: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setNewActivity((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateActivity = () => {
    if (
      !newActivity.title ||
      !newActivity.type ||
      !newActivity.date ||
      !newActivity.time ||
      !newActivity.location
    ) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const currentUserId = session?.user?.email || 'current-user';
    const newActivityData: Activity = {
      id: Date.now().toString(),
      title: newActivity.title,
      description: newActivity.description,
      date: newActivity.date,
      time: newActivity.time,
      location: newActivity.location,
      participants: [
        {
          id: currentUserId,
          name: session?.user?.name || 'Sarah Chen',
          avatar: 'https://i.pravatar.cc/150?img=1',
        },
      ],
      maxParticipants: parseInt(newActivity.maxParticipants) || 10,
      type: newActivity.type,
      ownerId: currentUserId,
    };

    setActivities((prev) => [...prev, newActivityData]);
    setNewActivity({
      title: '',
      type: '',
      date: '',
      time: '',
      location: '',
      maxParticipants: '',
      description: '',
    });
    onClose();
    toast({
      title: 'Activity created',
      description: 'Your new activity has been created successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleActivityAction = (activityId: string) => {
    const currentUserId = session?.user?.email || 'current-user';
    const activity = activities.find((a) => a.id === activityId);

    if (!activity) return;

    if (activity.ownerId === currentUserId) {
      // Owner is canceling - delete the activity
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
      toast({
        title: 'Activity deleted',
        description: 'The activity has been deleted successfully.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setActivities((prevActivities) =>
      prevActivities.map((activity) => {
        if (activity.id === activityId) {
          const isAlreadyParticipant = activity.participants.some(
            (p) => p.id === currentUserId,
          );

          if (isAlreadyParticipant) {
            // Remove user from activity
            return {
              ...activity,
              participants: activity.participants.filter(
                (p) => p.id !== currentUserId,
              ),
            };
          } else {
            // Check if activity is full
            if (activity.participants.length >= activity.maxParticipants) {
              toast({
                title: 'Activity full',
                description:
                  'This activity has reached its maximum number of participants.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
              });
              return activity;
            }

            // Add user to activity
            const newParticipant = {
              id: currentUserId,
              name: session?.user?.name || 'Sarah Chen',
              avatar: 'https://i.pravatar.cc/150?img=1',
            };

            return {
              ...activity,
              participants: [...activity.participants, newParticipant],
            };
          }
        }
        return activity;
      }),
    );

    const isAlreadyParticipant = activity.participants.some(
      (p) => p.id === currentUserId,
    );

    toast({
      title: isAlreadyParticipant
        ? 'Activity cancelled'
        : 'Successfully joined',
      description: isAlreadyParticipant
        ? 'You have been removed from the activity.'
        : 'You have been added to the activity.',
      status: isAlreadyParticipant ? 'info' : 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl" p={4}>
      <VStack align="stretch" spacing={8}>
        <HStack justify="space-between">
          <Button
            leftIcon={<Icon as={FiArrowLeft} />}
            variant="ghost"
            onClick={() => router.push('/social')}
          >
            Back to Social
          </Button>
          <Button
            leftIcon={<Icon as={FiPlus} />}
            colorScheme="blue"
            onClick={onOpen}
          >
            Schedule Activity
          </Button>
        </HStack>

        <Heading size="lg">Group Activities</Heading>
        <Text color="gray.600">
          Join group activities and connect with other members of the community.
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {activities.map((activity) => {
            const currentUserId = session?.user?.email || 'current-user';
            const isParticipant = activity.participants.some(
              (p) => p.id === currentUserId,
            );
            const isOwner = activity.ownerId === currentUserId;
            const isFull =
              activity.participants.length >= activity.maxParticipants;

            return (
              <Box
                key={activity.id}
                borderWidth="1px"
                borderRadius="lg"
                overflow="hidden"
                p={6}
                bg="white"
                boxShadow="sm"
                display="flex"
                flexDirection="column"
                height="100%"
              >
                <VStack align="stretch" spacing={4} flex="1">
                  <HStack justify="space-between">
                    <Heading size="md">{activity.title}</Heading>
                    <Badge colorScheme="blue">{activity.type}</Badge>
                  </HStack>
                  <Text color="gray.600">{activity.description}</Text>
                  <HStack>
                    <Icon as={FiCalendar} />
                    <Text>{activity.date}</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FiClock} />
                    <Text>{activity.time}</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FiMapPin} />
                    <Text>{activity.location}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <AvatarGroup size="sm" max={3}>
                      {activity.participants.map((participant) => (
                        <Avatar
                          key={participant.id}
                          name={participant.name}
                          src={participant.avatar}
                        />
                      ))}
                    </AvatarGroup>
                    <Text fontSize="sm" color="gray.500">
                      {activity.participants.length}/{activity.maxParticipants}{' '}
                      joined
                    </Text>
                  </HStack>
                </VStack>
                <Button
                  colorScheme={isOwner || isParticipant ? 'red' : 'blue'}
                  variant={isOwner || isParticipant ? 'outline' : 'solid'}
                  onClick={() => handleActivityAction(activity.id)}
                  isDisabled={!isParticipant && isFull}
                  mt={4}
                >
                  {isOwner
                    ? 'Delete Activity'
                    : isParticipant
                      ? 'Cancel Participation'
                      : isFull
                        ? 'Activity Full'
                        : 'Join Activity'}
                </Button>
              </Box>
            );
          })}
        </SimpleGrid>
      </VStack>

      {/* Create Activity Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Activity</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Activity Title</FormLabel>
                <Input
                  name="title"
                  value={newActivity.title}
                  onChange={handleInputChange}
                  placeholder="Enter activity title"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Type</FormLabel>
                <Select
                  name="type"
                  value={newActivity.type}
                  onChange={handleInputChange}
                  placeholder="Select activity type"
                >
                  <option value="Yoga">Yoga</option>
                  <option value="Running">Running</option>
                  <option value="Hiking">Hiking</option>
                  <option value="Cycling">Cycling</option>
                  <option value="Swimming">Swimming</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  name="date"
                  type="date"
                  value={newActivity.date}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Time</FormLabel>
                <Input
                  name="time"
                  type="time"
                  value={newActivity.time}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Location</FormLabel>
                <Input
                  name="location"
                  value={newActivity.location}
                  onChange={handleInputChange}
                  placeholder="Enter location"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Maximum Participants</FormLabel>
                <Input
                  name="maxParticipants"
                  type="number"
                  value={newActivity.maxParticipants}
                  onChange={handleInputChange}
                  placeholder="Enter max participants"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Input
                  name="description"
                  value={newActivity.description}
                  onChange={handleInputChange}
                  placeholder="Enter activity description"
                />
              </FormControl>

              <Button
                colorScheme="blue"
                w="full"
                onClick={handleCreateActivity}
              >
                Create Activity
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}
