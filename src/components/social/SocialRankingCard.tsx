import {
  Box,
  VStack,
  Text,
  Avatar,
  HStack,
  Progress,
  Icon,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react';
import { FaTrophy, FaMedal, FaStar } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface RankingUser {
  id: string;
  name: string;
  avatar: string;
  steps: number;
  isCurrentUser?: boolean;
}

const pixelFontStyle = {
  fontFamily: "var(--font-press-start)",
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return { icon: FaTrophy, color: 'yellow.400', label: '1ST' };
    case 2:
      return { icon: FaMedal, color: 'gray.400', label: '2ND' };
    case 3:
      return { icon: FaStar, color: 'orange.400', label: '3RD' };
    default:
      return null;
  }
};

const SocialRankingCard = () => {
  const { data: session } = useSession();
  const [rankings, setRankings] = useState<RankingUser[]>([]);

  useEffect(() => {
    // Initialize rankings with current user
    const initialRankings: RankingUser[] = [
      {
        id: 'current-user',
        name: session?.user?.name || 'You',
        avatar: session?.user?.image || '/avatars/default.png',
        steps: 11000,
        isCurrentUser: true
      },
      { id: '1', name: 'Sarah Chen', avatar: '/avatars/runner1.png', steps: 12500 },
      { id: '2', name: 'Mike Johnson', avatar: '/avatars/runner2.png', steps: 10200 },
      { id: '3', name: 'Emma Davis', avatar: '/avatars/runner3.png', steps: 9800 },
      { id: '4', name: 'Alex Kim', avatar: '/avatars/runner4.png', steps: 8900 },
    ];
    setRankings(initialRankings);
  }, [session]);

  const maxSteps = Math.max(...rankings.map(user => user.steps));
  const bgColor = useColorModeValue('transparent', 'transparent');
  const borderColor = useColorModeValue('purple.500', 'purple.400');

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
        WEEKLY RANKINGS 🏆
      </Text>

      <VStack spacing={4} align="stretch">
        {rankings.sort((a, b) => b.steps - a.steps).map((user, index) => {
          const rankInfo = getRankIcon(index + 1);
          
          return (
            <Box
              key={user.id}
              p={4}
              borderRadius="lg"
              bg={user.isCurrentUser ? 'rgba(236, 201, 75, 0.1)' : 'whiteAlpha.50'}
              border="2px solid"
              borderColor={user.isCurrentUser ? 'yellow.500' : borderColor}
              position="relative"
              transition="all 0.3s"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: user.isCurrentUser 
                  ? '0 0 20px rgba(236, 201, 75, 0.3)'
                  : '0 0 20px rgba(147, 51, 234, 0.3)',
              }}
              role="group"
            >
              <HStack spacing={4}>
                <Box
                  width="40px"
                  textAlign="center"
                >
                  {rankInfo ? (
                    <Icon
                      as={rankInfo.icon}
                      w={6}
                      h={6}
                      color={rankInfo.color}
                      filter="drop-shadow(0 0 5px currentColor)"
                    />
                  ) : (
                    <Text
                      sx={pixelFontStyle}
                      fontSize="sm"
                      color="whiteAlpha.700"
                    >
                      #{index + 1}
                    </Text>
                  )}
                </Box>

                <Avatar
                  src={user.avatar}
                  name={user.name}
                  size="sm"
                  border="2px solid"
                  borderColor={rankInfo?.color || 'purple.400'}
                  boxShadow={`0 0 10px ${rankInfo?.color || '#805AD5'}`}
                />

                <VStack align="start" spacing={1} flex={1}>
                  <HStack>
                    <Text
                      sx={pixelFontStyle}
                      fontSize="xs"
                      color="purple.800"
                      fontWeight="bold"
                    >
                      {user.name}
                    </Text>
                    {user.isCurrentUser && (
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
                  
                  <Box w="100%">
                    <Progress
                      value={(user.steps / maxSteps) * 100}
                      size="sm"
                      borderRadius="full"
                      bg="whiteAlpha.100"
                      sx={{
                        '& > div': {
                          background: user.isCurrentUser
                            ? 'linear-gradient(90deg, #ECC94B, #F6E05E)'
                            : rankInfo
                            ? `linear-gradient(90deg, ${rankInfo.color}, ${rankInfo.color}88)`
                            : 'linear-gradient(90deg, #9F7AEA, #805AD5)',
                          boxShadow: user.isCurrentUser
                            ? '0 0 10px rgba(236, 201, 75, 0.5)'
                            : '0 0 10px rgba(159, 122, 234, 0.5)',
                        }
                      }}
                    />
                  </Box>
                </VStack>

                <Text
                  sx={pixelFontStyle}
                  fontSize="xs"
                  color="pink.300"
                  minW="100px"
                  textAlign="right"
                  fontWeight="bold"
                  textShadow="0 0 5px rgba(236, 64, 122, 0.5)"
                >
                  {user.steps.toLocaleString()}
                  <Text as="span" color="pink.200" ml={1}>steps</Text>
                </Text>
              </HStack>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
};

export default SocialRankingCard; 