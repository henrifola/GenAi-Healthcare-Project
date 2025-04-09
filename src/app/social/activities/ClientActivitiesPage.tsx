'use client';

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
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiPlus,
} from 'react-icons/fi';
import Link from 'next/link';

// Dummy activities data
const activities = [
  {
    id: 1,
    title: 'Morning Run',
    type: 'Running',
    date: '2024-03-20',
    time: '07:00 AM',
    location: 'Central Park',
    participants: [
      { name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?img=1' },
      { name: 'Mike Johnson', avatar: 'https://i.pravatar.cc/150?img=2' },
      { name: 'Emma Davis', avatar: 'https://i.pravatar.cc/150?img=3' },
    ],
    maxParticipants: 5,
  },
  {
    id: 2,
    title: 'Yoga Session',
    type: 'Yoga',
    date: '2024-03-21',
    time: '18:00 PM',
    location: 'Wellness Center',
    participants: [
      { name: 'Lisa Park', avatar: 'https://i.pravatar.cc/150?img=5' },
      { name: 'Alex Kim', avatar: 'https://i.pravatar.cc/150?img=4' },
    ],
    maxParticipants: 8,
  },
  {
    id: 3,
    title: 'Weekend Hike',
    type: 'Hiking',
    date: '2024-03-23',
    time: '09:00 AM',
    location: 'Mountain Trail',
    participants: [
      { name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?img=1' },
      { name: 'Emma Davis', avatar: 'https://i.pravatar.cc/150?img=3' },
      { name: 'Lisa Park', avatar: 'https://i.pravatar.cc/150?img=5' },
      { name: 'Alex Kim', avatar: 'https://i.pravatar.cc/150?img=4' },
    ],
    maxParticipants: 6,
  },
];

export default function ClientActivitiesPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Container maxW="container.xl" p={4}>
      <VStack align="stretch" spacing={8}>
        <HStack justify="space-between">
          <Button
            as={Link}
            href="/social"
            variant="ghost"
            leftIcon={<FiArrowLeft />}
          >
            Back to Social
          </Button>
          <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={onOpen}>
            Create Activity
          </Button>
        </HStack>

        <Box>
          <Heading size="xl" mb={2}>
            Group Activities
          </Heading>
          <Text color="gray.600" mb={8}>
            Join or create group activities with your friends
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {activities.map((activity) => (
            <Box
              key={activity.id}
              bg="white"
              p={6}
              borderRadius="xl"
              boxShadow="sm"
            >
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between">
                  <Heading size="md">{activity.title}</Heading>
                  <Badge colorScheme="blue">{activity.type}</Badge>
                </HStack>

                <VStack align="stretch" spacing={2}>
                  <HStack>
                    <Icon as={FiCalendar} color="blue.500" />
                    <Text>{activity.date}</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FiClock} color="blue.500" />
                    <Text>{activity.time}</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FiMapPin} color="blue.500" />
                    <Text>{activity.location}</Text>
                  </HStack>
                </VStack>

                <HStack justify="space-between" align="center">
                  <AvatarGroup size="sm" max={3}>
                    {activity.participants.map((participant, index) => (
                      <Avatar
                        key={index}
                        name={participant.name}
                        src={participant.avatar}
                      />
                    ))}
                  </AvatarGroup>
                  <Text color="gray.600" fontSize="sm">
                    {activity.participants.length}/{activity.maxParticipants}{' '}
                    joined
                  </Text>
                </HStack>

                <Button
                  colorScheme="blue"
                  isDisabled={
                    activity.participants.length >= activity.maxParticipants
                  }
                >
                  {activity.participants.length >= activity.maxParticipants
                    ? 'Full'
                    : 'Join Activity'}
                </Button>
              </VStack>
            </Box>
          ))}
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
              <FormControl>
                <FormLabel>Activity Title</FormLabel>
                <Input placeholder="Enter activity title" />
              </FormControl>

              <FormControl>
                <FormLabel>Type</FormLabel>
                <Select placeholder="Select activity type">
                  <option value="running">Running</option>
                  <option value="yoga">Yoga</option>
                  <option value="hiking">Hiking</option>
                  <option value="cycling">Cycling</option>
                  <option value="workout">Workout</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Date</FormLabel>
                <Input type="date" />
              </FormControl>

              <FormControl>
                <FormLabel>Time</FormLabel>
                <Input type="time" />
              </FormControl>

              <FormControl>
                <FormLabel>Location</FormLabel>
                <Input placeholder="Enter location" />
              </FormControl>

              <FormControl>
                <FormLabel>Maximum Participants</FormLabel>
                <Input type="number" placeholder="Enter max participants" />
              </FormControl>

              <Button colorScheme="blue" w="full">
                Create Activity
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}
