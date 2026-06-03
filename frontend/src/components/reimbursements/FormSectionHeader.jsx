import { Box, Chip, Stack, Typography } from "@mui/material";
import { tokens } from "../../theme";

export default function FormSectionHeader({ index, title, description, action }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "flex-start" }} spacing={1.5}>
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        {index && (
          <Chip
            label={String(index).padStart(2, "0")}
            size="small"
            sx={{
              mt: 0.1,
              bgcolor: tokens.primarySoft,
              color: tokens.primaryDeep,
              border: `1px solid rgba(37,99,235,.18)`,
              fontWeight: 900,
            }}
          />
        )}
        <Box>
          <Typography variant="h6">{title}</Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
      {action}
    </Stack>
  );
}
