'use client';

import { Box, Button, Container, Heading, Text, Flex } from '@chakra-ui/react';
import { FiHeart, FiActivity } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { useEffect } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleLogin = () => {
    // Fitbit 로그인으로 직접 연결
    signIn('fitbit', { callbackUrl: '/dashboard' });
  };

  // If session is loading or user is authenticated, show nothing
  if (session) {
    return null;
  }

  return (
    <Box minH="100vh" bg="white" overflow="hidden">
      <Container maxW="container.xl" p={4}>
        {/* Navigation */}
        <Flex justify="flex-start" align="center" py={2} mb={8}>
          <Flex align="center" gap={2}>
            <FiHeart size={24} color="#3182CE" />
            <Heading size="lg" color="gray.800">
              HaruCare
            </Heading>
          </Flex>
        </Flex>

        {/* Main Content */}
        <Flex position="relative" direction="column" pt={8}>
          {/* Text Content */}
          <Box maxW="100%" zIndex={2}>
            <Box maxW="600px">
              <Heading
                as="h1"
                size="2xl"
                color="blue.800"
                lineHeight="1.2"
                mb={6}
              >
                Smart Monitoring for
                <br />
                Better Health
              </Heading>
              <Text fontSize="lg" color="gray.600" mb={16}>
                Monitor your health effortlessly with real-time tracking, expert
                insights, and personalized care—all in one place
              </Text>
              <Button
                onClick={handleLogin}
                size="lg"
                colorScheme="blue"
                px={8}
                py={6}
                fontSize="lg"
                mb={16}
              >
                Log in
              </Button>
            </Box>

            {/* Feature Boxes */}
            <Flex gap={6} mt={0} direction={{ base: 'column', md: 'row' }}>
              <Box
                bg="blue.50"
                p={6}
                borderRadius="xl"
                flex="1"
                maxW={{ base: '100%', md: 'calc(33.33% - 16px)' }}
                boxShadow="md"
              >
                <Flex
                  bg="blue.100"
                  w="50px"
                  h="50px"
                  borderRadius="lg"
                  align="center"
                  justify="center"
                  mb={4}
                >
                  <FiHeart size={24} color="#3182CE" />
                </Flex>
                <Heading size="md" mb={2} color="blue.800">
                  Track Health Metrics
                </Heading>
                <Text color="gray.600">
                  Monitor your heart rate, sleep quality, and daily activities
                  in one place.
                </Text>
              </Box>

              <Box
                bg="blue.50"
                p={6}
                borderRadius="xl"
                flex="1"
                maxW={{ base: '100%', md: 'calc(33.33% - 16px)' }}
                boxShadow="md"
              >
                <Flex
                  bg="blue.100"
                  w="50px"
                  h="50px"
                  borderRadius="lg"
                  align="center"
                  justify="center"
                  mb={4}
                >
                  <FiHeart size={24} color="#3182CE" />
                </Flex>
                <Heading size="md" mb={2} color="blue.800">
                  Social Connection
                </Heading>
                <Text color="gray.600">
                  Connect with friends and stay motivated on your wellness
                  journey together.
                </Text>
              </Box>

              <Box
                bg="blue.50"
                p={6}
                borderRadius="xl"
                flex="1"
                maxW={{ base: '100%', md: 'calc(33.33% - 16px)' }}
                boxShadow="md"
              >
                <Flex
                  bg="blue.100"
                  w="50px"
                  h="50px"
                  borderRadius="lg"
                  align="center"
                  justify="center"
                  mb={4}
                >
                  <FiHeart size={24} color="#3182CE" />
                </Flex>
                <Heading size="md" mb={2} color="blue.800">
                  AI-Powered Insights
                </Heading>
                <Text color="gray.600">
                  Get personalized health recommendations based on your daily
                  metrics.
                </Text>
              </Box>
            </Flex>
          </Box>

          {/* Hero Icon */}
          <Box
            position="absolute"
            right="5%"
            top="20%"
            transform="translateY(-20%)"
            width="40%"
            height="60%"
            zIndex={1}
            opacity={0.1}
            display={{ base: 'none', md: 'flex' }}
            alignItems="center"
            justifyContent="center"
          >
            <FiActivity size="100%" color="#3182CE" />
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
