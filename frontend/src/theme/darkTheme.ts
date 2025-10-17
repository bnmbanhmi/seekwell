import React from 'react';
import { createTheme } from '@mui/material/styles';

// Check if user prefers dark mode
const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Create a theme instance with dark mode support
export const getTheme = (darkMode: boolean = prefersDarkMode) => createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    ...(darkMode ? {
      // Dark mode palette
      primary: {
        main: '#64b5f6',
        light: '#90caf9',
        dark: '#42a5f5',
      },
      secondary: {
        main: '#81c784',
        light: '#a5d6a7',
        dark: '#66bb6a',
      },
      background: {
        default: '#1a1a1a',
        paper: '#2d2d2d',
      },
      text: {
        primary: '#e0e0e0',
        secondary: '#b0b0b0',
      },
      divider: '#4a4a4a',
      error: {
        main: '#ef5350',
      },
      warning: {
        main: '#ffa726',
      },
      info: {
        main: '#64b5f6',
      },
      success: {
        main: '#81c784',
      },
    } : {
      // Light mode palette (default)
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#36a41d',
      },
    }),
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          ...(darkMode && {
            backgroundColor: '#2d2d2d',
            color: '#e0e0e0',
          }),
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          ...(darkMode && {
            backgroundColor: '#2d2d2d',
            color: '#e0e0e0',
          }),
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Hook to detect dark mode changes
export const useDarkMode = () => {
  const [isDark, setIsDark] = React.useState(prefersDarkMode);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isDark;
};
