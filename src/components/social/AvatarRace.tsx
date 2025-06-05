import { useEffect, useState } from 'react';
import {
  Box,
  Image,
  Text,
  HStack,
  VStack,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

interface RacingAvatar {
  id: string;
  name: string;
  avatar: string;
  steps: number;
  color: string;
  isCurrentUser?: boolean;
}

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const pixelFontStyle = {
  fontFamily: "var(--font-press-start)",
};

const AvatarRace = () => {
  const { data: session } = useSession();
  const [avatars, setAvatars] = useState<RacingAvatar[]>([]);

  useEffect(() => {
    // Initialize avatars with current user and friends
    const initialAvatars: RacingAvatar[] = [
      {
        id: 'current-user',
        name: session?.user?.name || 'You',
        avatar: session?.user?.image || '/avatars/default.png',
        steps: 11000,
        color: 'yellow.400',
        isCurrentUser: true
      },
      { id: '1', name: 'Sarah Chen', avatar: '/avatars/runner1.png', steps: 12500, color: 'green.400' },
      { id: '2', name: 'Mike Johnson', avatar: '/avatars/runner2.png', steps: 10200, color: 'blue.400' },
      { id: '3', name: 'Emma Davis', avatar: '/avatars/runner3.png', steps: 9800, color: 'purple.400' },
    ];
    setAvatars(initialAvatars);
  }, [session]);

  const maxSteps = Math.max(...avatars.map(a => a.steps));
  const trackWidth = 800;
  const bgColor = useColorModeValue('transparent', 'transparent');
  const trackColor = useColorModeValue('whiteAlpha.100', 'whiteAlpha.100');
  const borderColor = useColorModeValue('purple.500', 'purple.400');
  const userTrackColor = useColorModeValue('yellow.900', 'yellow.900');

  // Simulated real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAvatars(prev => prev.map(avatar => ({
        ...avatar,
        steps: avatar.steps + Math.floor(Math.random() * 100)
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box>
      <Text
        sx={pixelFontStyle}
        fontSize="xl"
        fontWeight="bold"
        mb={6}
        color="pink.300"
        textShadow="0 0 10px #e60073"
      >
        LIVE RACE TRACK 🏃‍♂️
      </Text>

      <VStack spacing={8} align="stretch">
        {avatars.sort((a, b) => b.steps - a.steps).map((avatar, index) => (
          <Box key={avatar.id} position="relative">
            {/* Track */}
            <Box
              h="40px"
              bg={avatar.isCurrentUser ? userTrackColor : trackColor}
              borderRadius="full"
              position="relative"
              overflow="hidden"
              border="2px solid"
              borderColor={avatar.isCurrentUser ? 'yellow.500' : borderColor}
              boxShadow={avatar.isCurrentUser ? '0 0 15px rgba(236, 201, 75, 0.3)' : '0 0 15px rgba(147, 51, 234, 0.2)'}
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                transform: 'translateX(-100%)',
                animation: 'shimmer 2s infinite',
              }}
            >
              {/* Runner */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                animate={{
                  x: (avatar.steps / maxSteps) * (trackWidth - 80)
                }}
                transition={{
                  type: "spring",
                  stiffness: 60,
                  damping: 20
                }}
              >
                <Box
                  as={motion.div}
                  animation={`${bounce} 1s ease-in-out infinite`}
                >
                  <Image
                    src={avatar.avatar}
                    fallbackSrc={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${avatar.name}`}
                    alt={avatar.name}
                    boxSize="40px"
                    borderRadius="full"
                    border="2px solid"
                    borderColor={avatar.color}
                    boxShadow={`0 0 10px ${avatar.color}`}
                  />
                </Box>
              </motion.div>
            </Box>

            {/* Stats */}
            <HStack justify="space-between" mt={2}>
              <HStack>
                <Text
                  sx={pixelFontStyle}
                  fontSize="xs"
                  fontWeight="bold"
                  color={avatar.color}
                  textShadow={`0 0 5px ${avatar.color}`}
                >
                  {avatar.name}
                </Text>
                {avatar.isCurrentUser && (
                  <Badge
                    colorScheme="yellow"
                    variant="solid"
                    sx={pixelFontStyle}
                    fontSize="2xs"
                  >
                    YOU
                  </Badge>
                )}
              </HStack>
              <Text
                sx={pixelFontStyle}
                fontSize="xs"
                fontWeight="medium"
                color="whiteAlpha.900"
              >
                {avatar.steps.toLocaleString()} steps
              </Text>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default AvatarRace; 