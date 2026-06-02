import { Box, Stack, Typography } from "@mui/material";
import AnimatedNumber from "./AnimatedNumber";
import GlassCard from "./GlassCard";
import { tokens } from "../../theme";

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  prefix = "",
  suffix = "",
  decimals = 0,
  color = tokens.primary,
  loading = false,
  onClick,
}) {
  return (
    <GlassCard hover interactive={Boolean(onClick)} loading={loading} onClick={onClick}>
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.75, color: tokens.navy, fontWeight: 800 }}>
              <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
            </Typography>
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              display: "grid",
              placeItems: "center",
              borderRadius: "14px",
              color,
              bgcolor: `${color}12`,
              border: `1px solid ${color}22`,
            }}
          >
            {icon}
          </Box>
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
          {trend && (
            <Typography variant="caption" sx={{ color, fontWeight: 800 }}>
              {trend}
            </Typography>
          )}
        </Stack>
      </Stack>
    </GlassCard>
  );
}
