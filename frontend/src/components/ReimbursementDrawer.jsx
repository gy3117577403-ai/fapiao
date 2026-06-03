import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import { Box, Button, Divider, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import GlassCard from "./ui/GlassCard";
import StatusPill from "./ui/StatusPill";
import AnimatedNumber from "./ui/AnimatedNumber";
import { formatAmount, formatDate } from "../utils/formatters";
import { getInvoiceAmount, getInvoiceOverview } from "../utils/reimbursementList";
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
  const invoiceAmount = getInvoiceAmount(report);
  const invoiceOverview = getInvoiceOverview(report);

  const goTo = (path) => {
    onClose?.();
    navigate(path);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      transitionDuration={240}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 460, xl: 520 },
          p: 2.5,
          borderLeft: `1px solid ${tokens.border}`,
          background:
            "radial-gradient(circle at 40% 0%, rgba(37,99,235,.12), transparent 28%), rgba(248,251,255,.94)",
          backdropFilter: "blur(18px)",
          overflow: "hidden",
        },
      }}
    >
      <Stack spacing={2.5} sx={{ height: "100%", minHeight: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              报销单详情
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }} noWrap title={report?.purpose || ""}>
              {report?.purpose || "未命名报销单"}
            </Typography>
            {report && <StatusPill status={report.status} sx={{ mt: 1 }} />}
          </Box>
          <IconButton aria-label="关闭详情" title="关闭详情" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {report && (
          <Stack spacing={2.5} sx={{ minHeight: 0, overflowY: "auto", pr: 0.5 }}>
            <GlassCard>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    当前状态
                  </Typography>
                  <StatusPill status={report.status} />
                </Stack>
                <Divider />
                <DetailRow label="报销日期" value={formatDate(report.report_date, "—")} />
                <DetailRow label="出差人" value={report.employee_name} />
                <DetailRow label="部门" value={report.department} />
                <DetailRow label="出差事由" value={report.purpose} />
                <DetailRow label="补贴天数" value={`${report.subsidy_days || 0} 天`} />
              </Stack>
            </GlassCard>

            <GlassCard>
              <Stack spacing={1.4}>
                <Typography variant="h6">费用摘要</Typography>
                <DetailRow label="补贴天数" value={`${report.subsidy_days || 0} 天`} />
                <DetailRow label="途中补贴" value={formatAmount(report.subsidy_total)} />
                <DetailRow label="发票金额" value={formatAmount(invoiceAmount)} />
                <DetailRow label="预借金额" value={formatAmount(report.advance_amount)} />
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
                  <Typography fontWeight={800}>{formatAmount(report.shortfall)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    应退
                  </Typography>
                  <Typography fontWeight={800}>{formatAmount(report.surplus)}</Typography>
                </Stack>
              </Stack>
            </GlassCard>

            <GlassCard>
              <Stack spacing={1.4}>
                <Typography variant="h6">发票/附件概览</Typography>
                {invoiceOverview.invoiceCount === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    暂无发票明细
                  </Typography>
                ) : (
                  <>
                    <DetailRow label="发票数量" value={`${invoiceOverview.invoiceCount} 张`} />
                    <DetailRow label="已确认" value={`${invoiceOverview.confirmedCount} 张`} />
                    <DetailRow label="待确认" value={`${invoiceOverview.pendingCount} 张`} />
                  </>
                )}
              </Stack>
            </GlassCard>

            <Stack direction="row" spacing={1} sx={{ mt: "auto", position: "sticky", bottom: 0, pt: 1 }}>
              <Button fullWidth variant="outlined" onClick={onClose}>
                关闭
              </Button>
              <Button fullWidth startIcon={<EditIcon />} variant="outlined" onClick={() => goTo(`/reports/${report.id}/edit`)}>
                编辑
              </Button>
              <Button fullWidth startIcon={<PrintIcon />} variant="contained" onClick={() => goTo(`/reports/${report.id}/print`)}>
                打印
              </Button>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Drawer>
  );
}
