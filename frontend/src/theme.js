import { createTheme } from "@mui/material/styles";

export const tokens = {
  primary: "#2563eb",
  primaryDeep: "#1e40af",
  primarySoft: "#eff6ff",
  navy: "#0f172a",
  slate: "#334155",
  muted: "#64748b",
  pageBg: "#f5f7fb",
  border: "rgba(148, 163, 184, 0.22)",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#0284c7",
};

export const glassSurface = {
  background: "rgba(255, 255, 255, 0.86)",
  backdropFilter: "blur(18px)",
  border: `1px solid ${tokens.border}`,
  borderRadius: "18px",
  boxShadow: "0 1px 2px rgba(15,23,42,.05), 0 18px 45px rgba(15,23,42,.06)",
};

export const theme = createTheme({
  palette: {
    primary: {
      main: tokens.primary,
      dark: tokens.primaryDeep,
      light: tokens.primarySoft,
    },
    success: { main: tokens.success },
    warning: { main: tokens.warning },
    error: { main: tokens.danger },
    info: { main: tokens.info },
    text: {
      primary: tokens.navy,
      secondary: tokens.muted,
    },
    background: {
      default: tokens.pageBg,
      paper: "rgba(255,255,255,0.92)",
    },
    divider: tokens.border,
  },
  typography: {
    fontFamily:
      "'Inter', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    h4: { fontWeight: 800, letterSpacing: 0 },
    h5: { fontSize: 24, fontWeight: 700, letterSpacing: 0 },
    h6: { fontSize: 17, fontWeight: 700, letterSpacing: 0 },
    body1: { fontSize: 14 },
    body2: { fontSize: 13 },
    button: { fontWeight: 700, textTransform: "none", letterSpacing: 0 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontVariantNumeric: "tabular-nums",
          background: tokens.pageBg,
        },
        "*": {
          boxSizing: "border-box",
        },
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            scrollBehavior: "auto !important",
            transitionDuration: "0.01ms !important",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 36,
          borderRadius: 10,
          transition: "transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
          "&:hover": {
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
          "&:focus-visible": {
            boxShadow: `0 0 0 4px rgba(37, 99, 235, 0.16)`,
          },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.primaryDeep})`,
          boxShadow: "0 10px 24px rgba(37,99,235,.22)",
        },
        outlined: {
          background: "rgba(255,255,255,.78)",
          borderColor: tokens.border,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: 10,
          background: "rgba(255,255,255,.72)",
          transition: "box-shadow 180ms ease, background-color 180ms ease",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(37,99,235,.38)",
          },
          "&.Mui-focused": {
            boxShadow: "0 0 0 4px rgba(37,99,235,.12)",
          },
        },
        notchedOutline: {
          borderColor: tokens.border,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: glassSurface,
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          background: "rgba(248,250,252,.86)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: tokens.slate,
          fontWeight: 700,
          fontSize: 13,
        },
        body: {
          borderBottomColor: "rgba(148,163,184,.18)",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
        },
      },
    },
  },
});
