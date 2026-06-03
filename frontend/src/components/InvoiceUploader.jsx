import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import { Button, LinearProgress, Stack, Typography } from "@mui/material";
import StatusPill from "./ui/StatusPill";

export default function InvoiceUploader({ disabled, uploading = false, onChange, compact = false, label = "上传发票" }) {
  return (
    <Stack spacing={0.75} alignItems={compact ? "flex-end" : "stretch"}>
      <Button
        component="label"
        size="small"
        startIcon={uploading ? <HourglassTopIcon /> : <CloudUploadIcon />}
        disabled={disabled || uploading}
      >
        {uploading ? "上传中..." : label}
        <input hidden type="file" accept=".xml,.pdf,.ofd,image/*" onChange={onChange} />
      </Button>
      {uploading ? (
        <Stack spacing={0.5} sx={{ minWidth: compact ? 120 : "100%" }}>
          <LinearProgress sx={{ borderRadius: 999 }} />
          <Typography variant="caption" color="text.secondary">
            上传中，完成后进入金额确认流程
          </Typography>
        </Stack>
      ) : (
        <StatusPill status="unuploaded" label="未上传" icon={false} sx={{ display: compact ? { xs: "none", md: "inline-flex" } : "inline-flex" }} />
      )}
      {!uploading && disabled && <StatusPill status="ok" label="保存后可上传" />}
    </Stack>
  );
}
