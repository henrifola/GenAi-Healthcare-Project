'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import AvatarRace from '@/components/social/AvatarRace';
import SocialRankingCard from '@/components/social/SocialRankingCard';
import ChallengeCard from '@/components/social/ChallengeCard';
import EmotionShareCard from '@/components/social/EmotionShareCard';

// Pixel font style
const pixelFontStyle = {
  fontFamily: "var(--font-press-start)",
};

// Animation keyframes
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const glitch = keyframes`
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
`;

const shine = keyframes`
  0% { background-position: -100px; }
  100% { background-position: 200px; }
`;

export default function SocialPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push('/login');
    }
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [session, router]);

  const bgColor = useColorModeValue('navy.900', 'navy.900');
  const headingColor = useColorModeValue('pink.300', 'pink.200');
  const glowColor = useColorModeValue('purple.500', 'purple.400');

  if (!session) return null;

  if (loading) {
    return (
      <Box
        minH="100vh"
        bg={bgColor}
        color="white"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        position="relative"
        overflow="hidden"
        css={{
          background: 'linear-gradient(to bottom, #2a0e61, #1a0628)',
        }}
      >
        <Box
          sx={pixelFontStyle}
          fontSize="4xl"
          mb={8}
          color={headingColor}
          textShadow="0 0 10px #fff, 0 0 20px #fff, 0 0 30px #e60073, 0 0 40px #e60073"
          animation={`${glitch} 1s infinite`}
        >
          SOCIAL HUB
        </Box>
        <Box
          w="300px"
          h="30px"
          bg="gray.800"
          borderRadius="md"
          overflow="hidden"
          position="relative"
          border="2px solid"
          borderColor={glowColor}
        >
          <Box
            h="100%"
            w="60%"
            bg="linear-gradient(to right, transparent, pink.400, transparent)"
            animation={`${shine} 1s infinite linear`}
          />
          <Text
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            sx={pixelFontStyle}
            fontSize="sm"
          >
            Loading...
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      position="relative"
      overflow="hidden"
      css={{
        background: 'linear-gradient(to bottom, #2a0e61, #1a0628)',
      }}
    >
      {/* Grid background */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.1}
        css={{
          backgroundImage: 'linear-gradient(#9333ea 1px, transparent 1px), linear-gradient(to right, #9333ea 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Stars background */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={0}
        opacity={0.5}
        css={{
          background: 'radial-gradient(circle at center, #fff 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <Container maxW="container.xl" position="relative" zIndex={1} py={8}>
        <VStack spacing={12} align="stretch">
          <Box textAlign="center" mb={8}>
            <Heading
              sx={pixelFontStyle}
              fontSize="5xl"
              color={headingColor}
              textShadow="0 0 10px #fff, 0 0 20px #fff, 0 0 30px #e60073, 0 0 40px #e60073"
              animation={`${float} 3s ease-in-out infinite`}
              mb={4}
            >
              SOCIAL HUB
            </Heading>
            <Text
              sx={pixelFontStyle}
              fontSize="sm"
              color="purple.300"
              letterSpacing="2px"
            >
              COMPETE WITH FRIENDS
            </Text>
          </Box>

          <VStack spacing={8} align="stretch">
            {/* Full width race track */}
            <Box
              bg="rgba(0, 0, 0, 0.7)"
              borderRadius="xl"
              border="2px solid"
              borderColor={glowColor}
              p={6}
              boxShadow="0 0 20px rgba(147, 51, 234, 0.3)"
              backdropFilter="blur(5px)"
              position="relative"
              minH="400px"
              w="100%"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 'xl',
                padding: '2px',
                background: 'linear-gradient(45deg, #e60073, #9333ea)',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
                pointerEvents: 'none',
              }}
            >
              <AvatarRace />
            </Box>

            {/* Three column layout for rankings, emotions, and challenges */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              {/* Rankings */}
              <Box
                bg="rgba(0, 0, 0, 0.7)"
                borderRadius="xl"
                border="2px solid"
                borderColor={glowColor}
                p={6}
                boxShadow="0 0 20px rgba(147, 51, 234, 0.3)"
                backdropFilter="blur(5px)"
                position="relative"
                maxH="600px"
                overflowY="auto"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(147, 51, 234, 0.5)',
                    borderRadius: '4px',
                    '&:hover': {
                      background: 'rgba(147, 51, 234, 0.7)',
                    },
                  },
                }}
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 'xl',
                  padding: '2px',
                  background: 'linear-gradient(45deg, #e60073, #9333ea)',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  pointerEvents: 'none',
                }}
              >
                <SocialRankingCard />
              </Box>

              {/* Emotions */}
              <Box
                bg="rgba(0, 0, 0, 0.7)"
                borderRadius="xl"
                border="2px solid"
                borderColor={glowColor}
                p={6}
                boxShadow="0 0 20px rgba(147, 51, 234, 0.3)"
                backdropFilter="blur(5px)"
                position="relative"
                maxH="600px"
                overflowY="auto"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(147, 51, 234, 0.5)',
                    borderRadius: '4px',
                    '&:hover': {
                      background: 'rgba(147, 51, 234, 0.7)',
                    },
                  },
                }}
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 'xl',
                  padding: '2px',
                  background: 'linear-gradient(45deg, #e60073, #9333ea)',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  pointerEvents: 'none',
                }}
              >
                <EmotionShareCard />
              </Box>

              {/* Challenges */}
              <Box
                bg="rgba(0, 0, 0, 0.7)"
                borderRadius="xl"
                border="2px solid"
                borderColor={glowColor}
                p={6}
                boxShadow="0 0 20px rgba(147, 51, 234, 0.3)"
                backdropFilter="blur(5px)"
                position="relative"
                maxH="600px"
                overflowY="auto"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(147, 51, 234, 0.5)',
                    borderRadius: '4px',
                    '&:hover': {
                      background: 'rgba(147, 51, 234, 0.7)',
                    },
                  },
                }}
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 'xl',
                  padding: '2px',
                  background: 'linear-gradient(45deg, #e60073, #9333ea)',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  pointerEvents: 'none',
                }}
              >
                <ChallengeCard />
              </Box>
            </SimpleGrid>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}
