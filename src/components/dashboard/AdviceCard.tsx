import { Box, Text, VStack, Icon } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import { DailyAdvice } from '@/types/dashboard';

interface AdviceCardProps {
  advice: DailyAdvice;
}

export const AdviceCard = ({ advice }: AdviceCardProps) => {
  return (
    <Box
      p={6}
      bg="white"
      borderRadius="xl"
      boxShadow="0px 2px 4px rgba(0, 0, 0, 0.04)"
      transition="transform 0.2s"
      _hover={{ transform: 'translateY(-2px)' }}
    >
      <VStack align="stretch" gap={4}>
        <Box
          p={2}
          borderRadius="lg"
          bg="brand.50"
          color="brand.500"
          display="inline-flex"
          alignSelf="flex-start"
        >
          <Icon as={FiInfo} boxSize={5} />
        </Box>

        <VStack align="stretch" gap={2}>
          <Text fontSize="lg" fontWeight="semibold">
            {advice.title}
          </Text>
          <Text color="gray.600">{advice.description}</Text>
        </VStack>
      </VStack>
    </Box>
  );
};
