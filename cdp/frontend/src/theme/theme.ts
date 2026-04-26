"use client";

import { createTheme } from "@mui/material/styles";

// Minimal Dashboard Inspired Theme
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1C2B41", // Deep navy blue
      light: "#3C82F7", // Bright blue for accents
      dark: "#0F1A2E",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#3C82F7", // Action blue
      contrastText: "#ffffff",
    },
    success: {
      main: "#10B981", // Emerald green
    },
    warning: {
      main: "#F59E0B", // Amber
    },
    error: {
      main: "#EF4444", // Red
    },
    info: {
      main: "#3C82F7",
    },
    text: {
      primary: "#1A1A1A",
      secondary: "#6B7280",
      disabled: "#9CA3AF",
    },
    background: {
      default: "#F8FAFC", // Cool gray background
      paper: "#FFFFFF",
    },
    divider: "#E5E7EB",
  },
  typography: {
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    body1: {
      fontSize: 14,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: 12,
      lineHeight: 1.5,
    },
    h1: {
      fontSize: "1.875rem",
      fontWeight: 700,
      letterSpacing: "-0.025em",
    },
    h2: {
      fontSize: "1.5rem",
      fontWeight: 600,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontSize: "1.25rem",
      fontWeight: 600,
      letterSpacing: "-0.015em",
    },
    h4: {
      fontSize: "1rem",
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h5: {
      fontSize: "0.875rem",
      fontWeight: 600,
    },
    h6: {
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 6,
          fontWeight: 500,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
        contained: {
          "&:hover": {
            boxShadow: "0px 4px 12px rgba(28, 43, 65, 0.3)",
          },
        },
        outlined: {
          borderColor: "#E5E7EB",
          "&:hover": {
            borderColor: "#1C2B41",
            backgroundColor: "rgba(28, 43, 65, 0.04)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: "1px solid #E5E7EB",
          boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.05)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.05)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid #E5E7EB",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          "&.Mui-selected": {
            backgroundColor: "rgba(60, 130, 247, 0.1)",
            borderLeft: "3px solid #3C82F7",
            "&:hover": {
              backgroundColor: "rgba(60, 130, 247, 0.15)",
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#1C2B41",
          fontSize: "0.75rem",
          padding: "6px 12px",
          borderRadius: 4,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1C2B41",
          color: "#ffffff",
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
