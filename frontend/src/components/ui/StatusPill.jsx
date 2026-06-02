import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PrintIcon from "@mui/icons-material/Print";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Chip } from "@mui/material";
import { tokens } from "../../theme";

const STATUS_META = {
  all: { label: "全部", color: tokens.slate, bg: "rgba(51,65,85,.08)", icon: <RadioButtonUncheckedIcon /> },
  draft: { label: "草稿", color: tokens.slate, bg: "rgba(100,116,139,.12)", icon: <HourglassEmptyIcon /> },
  printed: { label: "已打印", color: tokens.info, bg: "rgba(2,132,199,.1)", icon: <PrintIcon /> },
  reimbursed: { label: "已报销", color: tokens.success, bg: "rgba(22,163,74,.1)", icon: <CheckCircleIcon /> },
  pending: { label: "待确认发票", color: tokens.warning, bg: "rgba(245,158,11,.12)", icon: <ErrorOutlineIcon /> },
  error: { label: "异常", color: tokens.danger, bg: "rgba(239,68,68,.12)", icon: <ErrorOutlineIcon /> },
  ok: { label: "正常", color: tokens.success, bg: "rgba(22,163,74,.1)", icon: <CheckCircleIcon /> },
};

export const getStatusMeta = (status) => STATUS_META[status] || { label: status || "未知", color: tokens.muted, bg: "rgba(100,116,139,.1)" };

export default function StatusPill({ status, label, size = "small", icon = true, sx }) {
  const meta = getStatusMeta(status);
  return (
    <Chip
      size={size}
      icon={icon && meta.icon ? meta.icon : undefined}
      label={label || meta.label}
      sx={{
        color: meta.color,
        bgcolor: meta.bg,
        border: `1px solid ${meta.color}22`,
        fontWeight: 700,
        "& .MuiChip-icon": { color: meta.color, fontSize: 16 },
        ...sx,
      }}
    />
  );
}
