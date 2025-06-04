import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Input,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FaSmile, FaHeart, FaRegPaperPlane, FaEllipsisH } from 'react-icons/fa';

interface Emotion {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: string;
  reactions: {
    userId: string;
    emoji: string;
  }[];
  comments: {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    message: string;
    timestamp: string;
  }[];
}

const pixelFontStyle = {
  fontFamily: "var(--font-press-start)",
};

const quickEmojis = ['🔥', '💪', '👏', '❤️', '🎉', '✨', '🌱', '🏃'];

const dummyEmotions: Emotion[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Sarah Chen',
    userAvatar: '/avatars/runner1.png',
    message: '오늘 완전 힘들다 🥲 하지만 포기는 없다!',
    timestamp: '방금 전',
    reactions: [
      { userId: '2', emoji: '💪' },
      { userId: '3', emoji: '🔥' },
    ],
    comments: [
      {
        id: 'c1',
        userId: '2',
        userName: 'Mike Johnson',
        userAvatar: '/avatars/runner2.png',
        message: '힘내세요! 같이 해요 💪',
        timestamp: '1분 전',
      },
    ],
  },
  {
    id: '2',
    userId: '3',
    userName: 'Emma Davis',
    userAvatar: '/avatars/runner3.png',
    message: '이제 시작! 🔥 오늘도 달려보자~',
    timestamp: '5분 전',
    reactions: [
      { userId: '1', emoji: '🎉' },
      { userId: '4', emoji: '✨' },
    ],
    comments: [],
  },
];

const EmotionShareCard = () => {
  const [emotions, setEmotions] = useState<Emotion[]>(dummyEmotions);
  const [newMessage, setNewMessage] = useState('');
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  
  const borderColor = useColorModeValue('purple.500', 'purple.400');
  const bgGlow = useColorModeValue('rgba(147, 51, 234, 0.1)', 'rgba(147, 51, 234, 0.2)');

  const handleShare = () => {
    if (!newMessage.trim()) return;

    const newEmotion: Emotion = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'You',
      userAvatar: '/avatars/default.png',
      message: newMessage,
      timestamp: '방금 전',
      reactions: [],
      comments: [],
    };

    setEmotions([newEmotion, ...emotions]);
    setNewMessage('');
  };

  const handleAddReaction = (emotionId: string, emoji: string) => {
    setEmotions(prev => prev.map(emotion => {
      if (emotion.id === emotionId) {
        const hasReacted = emotion.reactions.some(r => r.userId === 'current-user');
        if (!hasReacted) {
          return {
            ...emotion,
            reactions: [...emotion.reactions, { userId: 'current-user', emoji }],
          };
        }
      }
      return emotion;
    }));
  };

  const handleAddComment = (emotionId: string) => {
    const comment = commentInputs[emotionId];
    if (!comment?.trim()) return;

    setEmotions(prev => prev.map(emotion => {
      if (emotion.id === emotionId) {
        return {
          ...emotion,
          comments: [...emotion.comments, {
            id: Date.now().toString(),
            userId: 'current-user',
            userName: 'You',
            userAvatar: '/avatars/default.png',
            message: comment,
            timestamp: '방금 전',
          }],
        };
      }
      return emotion;
    }));

    setCommentInputs(prev => ({ ...prev, [emotionId]: '' }));
  };

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
        TODAY'S MOOD 💭
      </Text>

      {/* Share emotion input */}
      <HStack mb={6}>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="오늘의 기분을 공유해보세요..."
          bg="whiteAlpha.100"
          border="2px solid"
          borderColor={borderColor}
          _hover={{ borderColor: 'purple.400' }}
          _focus={{ borderColor: 'purple.300', boxShadow: 'none' }}
          sx={pixelFontStyle}
          fontSize="xs"
        />
        <IconButton
          aria-label="Share emotion"
          icon={<FaRegPaperPlane />}
          colorScheme="purple"
          onClick={handleShare}
          isDisabled={!newMessage.trim()}
        />
      </HStack>

      {/* Emotions list */}
      <VStack spacing={4} align="stretch">
        {emotions.map((emotion) => (
          <Box
            key={emotion.id}
            p={4}
            borderRadius="lg"
            bg="whiteAlpha.50"
            border="2px solid"
            borderColor={borderColor}
            transition="all 0.3s"
            _hover={{
              bg: bgGlow,
            }}
          >
            {/* User info and message */}
            <HStack spacing={3} mb={2}>
              <Avatar size="sm" src={emotion.userAvatar} name={emotion.userName} />
              <VStack align="start" spacing={0} flex={1}>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="purple.300"
                >
                  {emotion.userName}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  {emotion.timestamp}
                </Text>
              </VStack>
            </HStack>

            <Text
              fontSize="sm"
              color="whiteAlpha.900"
              mb={3}
            >
              {emotion.message}
            </Text>

            {/* Reactions */}
            <HStack spacing={2} mb={3}>
              {emotion.reactions.map((reaction, idx) => (
                <Box
                  key={idx}
                  px={2}
                  py={1}
                  borderRadius="full"
                  bg="whiteAlpha.200"
                  fontSize="sm"
                >
                  {reaction.emoji}
                </Box>
              ))}
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<FaSmile />}
                  variant="ghost"
                  size="sm"
                  colorScheme="purple"
                />
                <MenuList bg="gray.800" borderColor="purple.500">
                  <HStack spacing={1} p={2}>
                    {quickEmojis.map((emoji) => (
                      <IconButton
                        key={emoji}
                        aria-label={`React with ${emoji}`}
                        icon={<Text fontSize="lg">{emoji}</Text>}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddReaction(emotion.id, emoji)}
                      />
                    ))}
                  </HStack>
                </MenuList>
              </Menu>
            </HStack>

            {/* Comments */}
            <VStack spacing={2} align="stretch">
              {emotion.comments.map((comment) => (
                <Box
                  key={comment.id}
                  pl={4}
                  borderLeft="2px solid"
                  borderColor="purple.500"
                >
                  <HStack spacing={2}>
                    <Avatar size="xs" src={comment.userAvatar} name={comment.userName} />
                    <Text fontSize="xs" color="purple.300" fontWeight="bold">
                      {comment.userName}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {comment.timestamp}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="whiteAlpha.800" ml={6}>
                    {comment.message}
                  </Text>
                </Box>
              ))}

              {/* Add comment input */}
              <HStack>
                <Input
                  value={commentInputs[emotion.id] || ''}
                  onChange={(e) => setCommentInputs(prev => ({
                    ...prev,
                    [emotion.id]: e.target.value
                  }))}
                  placeholder="응원의 한마디..."
                  size="sm"
                  fontSize="xs"
                  bg="whiteAlpha.100"
                  border="1px solid"
                  borderColor="purple.500"
                />
                <IconButton
                  aria-label="Add comment"
                  icon={<FaRegPaperPlane />}
                  size="sm"
                  colorScheme="purple"
                  variant="ghost"
                  onClick={() => handleAddComment(emotion.id)}
                  isDisabled={!commentInputs[emotion.id]?.trim()}
                />
              </HStack>
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default EmotionShareCard; 