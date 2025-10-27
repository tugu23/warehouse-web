import { createTheme, ThemeOptions } from '@mui/material/styles';

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: {
            main: '#667eea',
            light: '#a8b5f5',
            dark: '#4c5db7',
          },
          secondary: {
            main: '#764ba2',
            light: '#a477c5',
            dark: '#553776',
          },
          background: {
            default: '#f5f7fa',
            paper: '#ffffff',
          },
          text: {
            primary: '#1a202c',
            secondary: '#718096',
          },
        }
      : {
          primary: {
            main: '#8b9aee',
            light: '#b3bdf4',
            dark: '#6974bb',
          },
          secondary: {
            main: '#9368b9',
            light: '#b594cf',
            dark: '#6d4d8b',
          },
          background: {
            default: '#1a202c',
            paper: '#2d3748',
          },
          text: {
            primary: '#f7fafc',
            secondary: '#cbd5e0',
          },
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

export const createAppTheme = (mode: 'light' | 'dark') => createTheme(getDesignTokens(mode));
