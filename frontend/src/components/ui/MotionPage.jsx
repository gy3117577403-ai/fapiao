import { Box } from "@mui/material";

export default function MotionPage({ children, sx }) {
  return (
    <Box
      sx={{
        "@keyframes pageIn": {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        animation: "pageIn 240ms ease both",
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
