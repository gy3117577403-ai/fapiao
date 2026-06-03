import { Box, Card, CardContent, Skeleton } from "@mui/material";
import { glassSurface } from "../../theme";

export default function GlassCard({
  children,
  hover = false,
  interactive = false,
  loading = false,
  className,
  sx,
  contentSx,
  ...props
}) {
  return (
    <Card
      className={className}
      {...props}
      sx={{
        ...glassSurface,
        overflow: "hidden",
        position: "relative",
        transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        ...(hover || interactive
          ? {
              "&:hover": {
                transform: "translateY(-2px)",
                borderColor: "rgba(37,99,235,.28)",
                boxShadow: "0 2px 4px rgba(15,23,42,.05), 0 24px 58px rgba(15,23,42,.1)",
              },
            }
          : {}),
        ...(interactive ? { cursor: "pointer" } : {}),
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
          "&:hover": {
            transform: "none",
          },
        },
        ...sx,
      }}
    >
      {loading && (
        <Box sx={{ p: 2 }}>
          <Skeleton height={24} width="45%" />
          <Skeleton height={46} width="65%" />
          <Skeleton height={18} width="80%" />
        </Box>
      )}
      {!loading && <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 }, ...contentSx }}>{children}</CardContent>}
    </Card>
  );
}
