import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { Box, Button, Stack, Typography } from "@mui/material";
import { tokens } from "../../theme";

export default function EmptyState({
  title,
  description,
  actionText,
  actionLabel,
  onAction,
  actionTo,
  actionComponent,
  icon,
  compact = false,
}) {
  const ActionComponent = actionComponent;
  const action = actionText || actionLabel;
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: compact ? 3 : 5, px: 2, textAlign: "center" }}>
      <Box
        sx={{
          width: compact ? 46 : 58,
          height: compact ? 46 : 58,
          display: "grid",
          placeItems: "center",
          borderRadius: "18px",
          color: tokens.primary,
          bgcolor: tokens.primarySoft,
          border: `1px solid ${tokens.border}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.9)",
          "& svg": { fontSize: compact ? 22 : 28 },
        }}
      >
        {icon || <AddCircleOutlineIcon />}
      </Box>
      <Typography variant="h6" sx={{ color: tokens.navy }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button
          component={ActionComponent}
          to={actionTo}
          variant="contained"
          size="small"
          onClick={onAction}
          sx={{ mt: 0.5 }}
        >
          {action}
        </Button>
      )}
    </Stack>
  );
}
