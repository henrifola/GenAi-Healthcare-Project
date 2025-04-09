import { Box, Text, Progress, VStack, HStack, Icon } from '@chakra-ui/react';
import { FiMoon } from 'react-icons/fi';

interface SleepQualityCardProps {
  hours: number;
  quality: number;
}

export const SleepQualityCard = ({ hours, quality }: SleepQualityCardProps) => {
  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'success.500';
    if (quality >= 60) return 'brand.500';
    if (quality >= 40) return 'warning.500';
    return 'error.500';
  };

  const qualityColor = getQualityColor(quality);

  return (
    <Box
      p={6}
      bg="white"
      borderRadius="xl"
      boxShadow="0px 2px 4px rgba(0, 0, 0, 0.04)"
      transition="transform 0.2s"
      _hover={{ transform: 'translateY(-2px)' }}
    >
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between">
          <Box
            p={2}
            borderRadius="lg"
            bg="brand.50"
            color="brand.500"
            display="inline-flex"
          >
            <Icon as={FiMoon} boxSize={5} />
          </Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.500">
            Last Night
          </Text>
        </HStack>

        <VStack align="stretch" gap={2}>
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.500">
              Sleep Quality
            </Text>
            <Text fontSize="sm" fontWeight="medium" color={qualityColor}>
              {quality}%
            </Text>
          </HStack>
          <Progress
            value={quality}
            size="sm"
            borderRadius="full"
            colorScheme={
              quality >= 80
                ? 'green'
                : quality >= 60
                  ? 'blue'
                  : quality >= 40
                    ? 'orange'
                    : 'red'
            }
          />
        </VStack>

        <Box>
          <Text fontSize="sm" color="gray.500">
            Hours Slept
          </Text>
          <Text fontSize="2xl" fontWeight="semibold">
            {hours} hrs
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};
