import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Box, Button, Divider, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import GlassCard from "./ui/GlassCard";
import StatusPill from "./ui/StatusPill";
import AnimatedNumber from "./ui/AnimatedNumber";
import { tokens } from "../theme";

const formatAmountValue = (value) => Number(value ?? 0);

function DetailRow({ label, value, strong = false }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={strong ? 800 : 700} sx={{ color: strong ? tokens.navy : tokens.slate }}>
        {value || "—"}
      </Typography>
    </Stack>
  );
}

export default function ReimbursementDrawer({ report, open, onClose }) {
  const navigate = useNavigate();
  const invoiceAmount = Number(report?.total_amount || 0) - Number(report?.subsidy_total || 0);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 460 },
          p: 2.5,
          borderLeft: `1px solid ${tokens.border}`,
          background:
            "radial-gradient(circle at 40% 0%, rgba(37,99,235,.12), transparent 28%), rgba(248,251,255,.94)",
          backdropFilter: "blur(18px)",
        },
      }}
    >
      <Stack spacing={2.5} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              报销单详情
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>
              {report?.purpose || "未命名报销单"}
            </Typography>
          </Box>
          <IconButton aria-label="关闭详情" title="关闭详情" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {report && (
          <>
            <GlassCard>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    当前状态
                  </Typography>
                  <StatusPill status={report.status} />
                </Stack>
                <Divider />
                <DetailRow label="报销日期" value={report.report_date} />
                <DetailRow label="出差人" value={report.employee_name} />
                <DetailRow label="部门" value={report.department} />
                <DetailRow label="补贴天数" value={`${report.subsidy_days || 0} 天`} />
              </Stack>
            </GlassCard>

            <GlassCard>
              <Stack spacing={1.4}>
                <Typography variant="h6">费用摘要</Typography>
                <DetailRow label="途中补贴" value={`¥${Number(report.subsidy_total || 0).toFixed(2)}`} />
                <DetailRow label="发票金额" value={`¥${Math.max(0, invoiceAmount).toFixed(2)}`} />
                <DetailRow label="预借金额" value={`¥${Number(report.advance_amount || 0).toFixed(2)}`} />
                <Divider />
                <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                  <Typography fontWeight={800}>报销总金额</Typography>
                  <Typography variant="h5" fontWeight={900} color={tokens.primaryDeep}>
                    ¥<AnimatedNumber value={formatAmountValue(report.total_amount)} decimals={2} />
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    应补
                  </Typography>
                  <Typography fontWeight={800}>¥{Number(report.shortfall || 0).toFixed(2)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    应退
                  </Typography>
                  <Typography fontWeight={800}>¥{Number(report.surplus || 0).toFixed(2)}</Typography>
                </Stack>
              </Stack>
            </GlassCard>

            <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
              <Button fullWidth startIcon={<VisibilityIcon />} variant="outlined" onClick={() => navigate(`/reports/${report.id}/edit`)}>
                查看/编辑
              </Button>
              <Button fullWidth startIcon={<PrintIcon />} variant="contained" onClick={() => navigate(`/reports/${report.id}/print`)}>
                打印预览
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </Drawer>
  );
}
