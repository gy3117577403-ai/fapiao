import { useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Button, CircularProgress, IconButton, Popover, Stack, Tooltip, Typography } from "@mui/material";
import StatusPill from "../ui/StatusPill";
import { tokens } from "../../theme";

const healthText = (health, loading) => {
  if (loading) return "同步中...";
  if (!health?.success) return "后端异常";
  return health?.data?.database ? "后端正常 · 数据库正常" : "后端正常 · 数据库待确认";
};

export default function SystemHealthPill({ health, loading, onRefresh, refreshedAt }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const backendOk = Boolean(health?.success);
  const databaseOk = Boolean(health?.success && health?.data?.database);
  const status = loading ? "saving" : backendOk ? "ok" : "error";

  return (
    <>
      <Button
        size="small"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          justifyContent: "flex-start",
          gap: 0.75,
          px: 1,
          border: `1px solid ${backendOk ? "rgba(22,163,74,.2)" : "rgba(239,68,68,.22)"}`,
          bgcolor: backendOk ? "rgba(22,163,74,.08)" : "rgba(239,68,68,.08)",
          color: backendOk ? tokens.success : tokens.danger,
          minWidth: { xs: 40, sm: 196 },
        }}
      >
        {loading ? <CircularProgress size={14} color="inherit" /> : <StatusPill status={status} label="" icon sx={{ "& .MuiChip-label": { display: "none" } }} />}
        <Typography variant="caption" fontWeight={800} sx={{ display: { xs: "none", sm: "inline" } }}>
          {healthText(health, loading)}
        </Typography>
      </Button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            p: 2,
            width: 340,
            borderRadius: 3,
            border: `1px solid ${tokens.border}`,
            bgcolor: "rgba(255,255,255,.92)",
            backdropFilter: "blur(18px)",
          },
        }}
      >
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">系统状态</Typography>
            <Tooltip title="重新检查">
              <span>
                <IconButton aria-label="重新检查系统状态" size="small" onClick={onRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              后端
            </Typography>
            <StatusPill status={backendOk ? "ok" : "error"} label={backendOk ? "后端正常" : "后端异常"} />
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              数据库
            </Typography>
            <StatusPill status={databaseOk ? "ok" : "error"} label={databaseOk ? "数据库正常" : "数据库异常"} />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
            路径：{health?.data?.database || "尚未返回"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            最近刷新：{loading ? "同步中..." : refreshedAt || "尚未刷新"}
          </Typography>
        </Stack>
      </Popover>
    </>
  );
}
