import { Stack, Typography } from "@mui/material";
import StatusPill from "../ui/StatusPill";

const meta = {
  idle: { status: "draft", label: "未保存" },
  dirty: { status: "draft", label: "有未保存修改" },
  saving: { status: "saving", label: "保存中..." },
  saved: { status: "saved", label: "已保存" },
  failed: { status: "error", label: "保存失败，点击重试" },
};

export default function SaveStatusIndicator({ state = "idle", compact = false }) {
  const item = meta[state] || meta.idle;
  return (
    <Stack direction="row" spacing={0.8} alignItems="center">
      <StatusPill status={item.status} label={item.label} />
      {!compact && (
        <Typography variant="caption" color="text.secondary">
          手动保存状态
        </Typography>
      )}
    </Stack>
  );
}
