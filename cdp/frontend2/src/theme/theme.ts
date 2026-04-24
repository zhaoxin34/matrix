'use client';

import { createTheme } from '@mui/material/styles';

// Theme colors matching Ant Design style
const theme = createTheme({
  palette: {
    primary: {
      main: '#1890ff',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1890ff',
    },
    success: {
      main: '#52c41a',
    },
    warning: {
      main: '#faad14',
    },
    error: {
      main: '#ff4d4f',
    },
    info: {
      main: '#1890ff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.85)',
      secondary: 'rgba(0, 0, 0, 0.45)',
    },
    background: {
      default: '#ffffff',
    },
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    fontSize: 14,
    body1: {
      fontSize: 14,
    },
    body2: {
      fontSize: 12,
    },
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 4,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        },
      },
    },
  },
});

export default theme;
