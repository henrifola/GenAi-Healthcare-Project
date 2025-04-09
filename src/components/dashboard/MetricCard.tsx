import { Box, Text, Icon, VStack, HStack, Button } from '@chakra-ui/react';
import { IconType } from 'react-icons';
import { FiArrowUp, FiArrowDown, FiUsers } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface MetricCardProps {
  icon: IconType;
  label: string;
  value: number;
  unit?: string;
  change?: number;
  showCompare?: boolean;
}

export const MetricCard = ({
  icon,
  label,
  value,
  unit,
  change,
  showCompare,
}: MetricCardProps) => {
  const router = useRouter();
  const isPositive = change && change > 0;
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
        <HStack justify="space-between">
          <Box
            p={2}
            borderRadius="lg"
            bg="brand.50"
            color="brand.500"
            display="inline-flex"
          >
            <Icon as={icon} boxSize={5} />
          </Box>
          {change && (
            <HStack spacing={1} color={changeColor}>
              <Icon as={changeIcon} boxSize={4} />
              <Text fontSize="sm" fontWeight="medium">
                {Math.abs(change)}%
              </Text>
            </HStack>
          )}
        </HStack>

        <VStack align="stretch" gap={1}>
          <Text color="gray.500" fontSize="sm">
            {label}
          </Text>
          <HStack spacing={1}>
            <Text fontSize="2xl" fontWeight="semibold">
              {value.toLocaleString()}
            </Text>
            {unit && (
              <Text fontSize="sm" color="gray.500">
                {unit}
              </Text>
            )}
          </HStack>
        </VStack>

        {showCompare && (
          <Button
            size="sm"
            variant="ghost"
            colorScheme="brand"
            leftIcon={<Icon as={FiUsers} />}
            onClick={() => router.push('/social')}
          >
            Compare with Friends
          </Button>
        )}
      </VStack>
    </Box>
  );
};
