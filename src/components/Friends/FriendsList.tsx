import { useEffect, useState } from 'react';
import { useToast, Box, VStack, Text, Button, Avatar, HStack, Divider } from '@chakra-ui/react';
import axios from 'axios';
import { FriendsResponse, FriendRequestResponse } from '@/types/api';
import { IFriend, IUser } from '@/types/models';

interface FriendItemProps {
  friend: IUser;
  status: 'pending' | 'accepted' | 'rejected';
  onAccept?: () => Promise<void>;
  onReject?: () => Promise<void>;
}

function FriendItem({ friend, status, onAccept, onReject }: FriendItemProps) {
  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <HStack spacing={4} justify="space-between">
        <HStack spacing={4}>
          <Avatar name={friend.name} src={friend.image || undefined} />
          <Box>
            <Text fontWeight="bold">{friend.name}</Text>
            <Text fontSize="sm" color="gray.500">{friend.email}</Text>
          </Box>
        </HStack>
        {status === 'pending' && (
          <HStack spacing={2}>
            <Button size="sm" colorScheme="green" onClick={onAccept}>
              수락
            </Button>
            <Button size="sm" colorScheme="red" onClick={onReject}>
              거절
            </Button>
          </HStack>
        )}
        {status === 'accepted' && (
          <Text color="green.500">친구</Text>
        )}
      </HStack>
    </Box>
  );
}

export default function FriendsList() {
  const [friends, setFriends] = useState<(IFriend & { friend: IUser })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchFriends = async () => {
    try {
      const { data } = await axios.get<FriendsResponse>('/api/friends');
      if (data.success && data.data) {
        setFriends(data.data.friends);
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '친구 목록을 불러오는데 실패했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFriendRequest = async (friendId: string, action: 'accept' | 'reject') => {
    try {
      const { data } = await axios.put<FriendRequestResponse>(`/api/friends/${friendId}`, { action });
      if (data.success) {
        await fetchFriends();
        toast({
          title: action === 'accept' ? '친구 요청 수락' : '친구 요청 거절',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '요청 처리에 실패했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  if (isLoading) {
    return <Text>로딩 중...</Text>;
  }

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">친구 목록</Text>
      <Divider />
      {friends.length === 0 ? (
        <Text color="gray.500">아직 친구가 없습니다.</Text>
      ) : (
        friends.map((friend) => (
          <FriendItem
            key={friend._id.toString()}
            friend={friend.friend}
            status={friend.status}
            onAccept={friend.status === 'pending' ? () => handleFriendRequest(friend._id.toString(), 'accept') : undefined}
            onReject={friend.status === 'pending' ? () => handleFriendRequest(friend._id.toString(), 'reject') : undefined}
          />
        ))
      )}
    </VStack>
  );
} 