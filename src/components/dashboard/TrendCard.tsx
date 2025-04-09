import { Box, Text, Icon, VStack, HStack } from '@chakra-ui/react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { ActivityTrend } from '@/types/dashboard';

interface TrendCardProps {
  trend: ActivityTrend;
}

export const TrendCard = ({ trend }: TrendCardProps) => {
  const isPositive = trend.change > 0;
  const changeColor = isPositive ? 'success.500' : 'error.500';
  const changeIcon = isPositive ? FiArrowUp : FiArrowDown;

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
        <Text color="gray.500" fontSize="sm">
          {trend.label}
        </Text>

        <HStack justify="space-between">
          <Text fontSize="2xl" fontWeight="semibold">
            {trend.value.toLocaleString()}
          </Text>
          <HStack gap={1} color={changeColor}>
            <Icon as={changeIcon} boxSize={4} />
            <Text fontSize="sm" fontWeight="medium">
              {Math.abs(trend.change)}%
            </Text>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
};
