'use client';

import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: '#F8F9FC',
        color: '#1A1D1F',
      },
    },
  },
  components: {
    Box: {
      baseStyle: {
        borderRadius: 'xl',
        bg: 'white',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.04)',
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'xl',
          bg: 'white',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.04)',
          p: 6,
        },
      },
    },
    Heading: {
      baseStyle: {
        color: '#1A1D1F',
        fontWeight: '600',
      },
    },
  },
  colors: {
    brand: {
      50: '#E6F6FF',
      100: '#BAE3FF',
      500: '#2E90FA',
      600: '#1570CD',
    },
    success: {
      50: '#ECFDF3',
      500: '#12B76A',
    },
    warning: {
      50: '#FFF6ED',
      500: '#F79009',
    },
    error: {
      50: '#FEF3F2',
      500: '#F04438',
    },
  },
});

export default theme;
