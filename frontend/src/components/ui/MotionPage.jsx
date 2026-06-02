import { Box } from "@mui/material";

export default function MotionPage({ children, sx }) {
  return (
    <Box
      sx={{
        "@keyframes pageIn": {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        animation: "pageIn 260ms ease both",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
