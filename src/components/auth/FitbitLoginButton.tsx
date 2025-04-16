'use client';
import React from 'react';
import { Button } from '@chakra-ui/react';
import { signIn } from 'next-auth/react';
import { FiActivity } from 'react-icons/fi';

const FitbitLoginButton = () => {
  return (
    <Button
      onClick={() => signIn('fitbit', { callbackUrl: '/dashboard' })}
      colorScheme="purple"
      size="lg"
      leftIcon={<FiActivity />}
    >
      Sign in with Fitbit
    </Button>
  );
};

export default FitbitLoginButton;