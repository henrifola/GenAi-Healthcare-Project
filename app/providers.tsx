'use client';

import {
  ChakraProvider,
  extendTheme,
  type ThemeConfig,
  type Theme
} from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme: Theme = extendTheme({ config }); // ✅ 타입 명확하게

export function Providers({ children }: { children: React.ReactNode }) {
  return <ChakraProvider theme={theme}>{children}</ChakraProvider>;
}



