import { useState } from 'react';
import { useToast, Input, Button, VStack, FormControl, FormLabel } from '@chakra-ui/react';
import axios, { AxiosError } from 'axios';
import { FriendRequestResponse } from '@/types/api';

export default function AddFriend() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await axios.post<FriendRequestResponse>('/api/friends', { email });
      
      if (data.success) {
        toast({
          title: '친구 요청 전송 완료',
          description: '상대방의 수락을 기다려주세요.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setEmail('');
      } else {
        throw new Error(data.error || '친구 요청 전송에 실패했습니다.');
      }
    } catch (error) {
      const errorMessage = error instanceof AxiosError 
        ? error.response?.data?.error || error.message
        : error instanceof Error 
          ? error.message 
          : '친구 요청 전송에 실패했습니다.';

      toast({
        title: '오류 발생',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl isRequired>
          <FormLabel>친구 이메일</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@example.com"
            isDisabled={isLoading}
          />
        </FormControl>
        <Button
          type="submit"
          colorScheme="blue"
          isLoading={isLoading}
          loadingText="전송 중..."
          width="100%"
        >
          친구 요청 보내기
        </Button>
      </VStack>
    </form>
  );
} 