'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Button, 
  Input, 
  VStack, 
  Heading, 
  Box, 
  Divider, 
  Text,
  HStack
} from '@chakra-ui/react';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import FitbitLoginButton from '@/components/auth/FitbitLoginButton';

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      p={4}
    >
      <VStack gap={4} width="100%" maxW="400px">
        <Heading>Login</Heading>
        
        {/* OAuth 로그인 버튼 */}
        <VStack width="100%" spacing={4}>
          <GoogleLoginButton />
          <FitbitLoginButton />
        </VStack>
        
        <HStack width="100%" my={4}>
          <Divider />
          <Text fontSize="sm" color="gray.500" whiteSpace="nowrap" px={2}>
            OR
          </Text>
          <Divider />
        </HStack>
        
        {/* 기존 이메일/비밀번호 로그인 폼 */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <VStack gap={4} width="100%">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" colorScheme="blue" width="100%">
              Sign In
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
}
