'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  VStack, 
  Heading, 
  Box
} from '@chakra-ui/react';
import FitbitLoginButton from '@/components/auth/FitbitLoginButton';

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

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
        
        {/* Fitbit 로그인 버튼 */}
        <VStack width="100%" spacing={4}>
          <FitbitLoginButton />
        </VStack>
      </VStack>
    </Box>
  );
}
