import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Stack, Typography } from "@mui/material";
import { tokens } from "../../theme";

export default function ConfirmChecklist({ items }) {
  return (
    <Stack spacing={1}>
      {items.map((item) => (
        <Stack key={item.label} direction="row" spacing={1} alignItems="center">
          {item.done ? (
            <CheckCircleIcon fontSize="small" sx={{ color: tokens.success }} />
          ) : (
            <RadioButtonUncheckedIcon fontSize="small" sx={{ color: tokens.muted }} />
          )}
          <Typography variant="body2" color={item.done ? tokens.slate : "text.secondary"} fontWeight={item.done ? 700 : 500}>
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
