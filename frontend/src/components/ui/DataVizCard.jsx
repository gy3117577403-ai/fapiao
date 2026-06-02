import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import EmptyState from "./EmptyState";
import GlassCard from "./GlassCard";
import { tokens } from "../../theme";

export default function DataVizCard({ title, description, action, loading = false, empty = false, emptyTitle, emptyDescription, emptyAction, children, height = 280 }) {
  return (
    <GlassCard sx={{ height: "100%" }}>
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ color: tokens.navy }}>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {description}
              </Typography>
            )}
          </Box>
          {action}
        </Stack>
        <Box sx={{ height, minHeight: height, position: "relative" }}>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
              <CircularProgress size={28} />
            </Stack>
          ) : empty ? (
            <EmptyState
              compact
              title={emptyTitle || "暂无数据"}
              description={emptyDescription}
              actionLabel={emptyAction?.label}
              actionTo={emptyAction?.to}
              actionComponent={emptyAction?.component}
              onAction={emptyAction?.onClick}
            />
          ) : (
            children
          )}
        </Box>
      </Stack>
    </GlassCard>
  );
}
