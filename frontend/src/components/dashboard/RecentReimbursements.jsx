import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EmptyState from "../ui/EmptyState";
import GlassCard from "../ui/GlassCard";
import StatusPill from "../ui/StatusPill";
import { formatAmount, formatDate } from "../../utils/formatters";
import { tokens } from "../../theme";

export default function RecentReimbursements({ reports, activeFilter, filterLabel, onClearFilter, onOpenReport }) {
  const hasFilter = activeFilter && activeFilter !== "all";

  return (
    <GlassCard>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
          <Box>
            <Typography variant="h6">最近报销单</Typography>
            <Typography variant="body2" color="text.secondary">
              当前筛选：{filterLabel}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {hasFilter && (
              <Button size="small" variant="outlined" onClick={onClearFilter}>
                清除筛选
              </Button>
            )}
            <Button component={RouterLink} to="/reports" variant="outlined" size="small" endIcon={<ArrowForwardIcon />}>
              查看全部
            </Button>
            <Button component={RouterLink} to="/reports/new" variant="contained" size="small" startIcon={<AddCircleOutlineIcon />}>
              新建报销单
            </Button>
          </Stack>
        </Stack>

        {reports.length === 0 ? (
          <EmptyState
            title="暂无报销单"
            description="创建第一张报销单后，你可以在这里查看最近记录和状态变化。"
            actionText="新建报销单"
            actionTo="/reports/new"
            actionComponent={RouterLink}
          />
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 840 }}>
              <TableHead>
                <TableRow>
                  <TableCell>报销日期</TableCell>
                  <TableCell>出差事由</TableCell>
                  <TableCell>出差人</TableCell>
                  <TableCell align="right">金额</TableCell>
                  <TableCell align="center">状态</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow
                    key={report.id}
                    hover
                    onClick={() => onOpenReport(report)}
                    sx={{
                      cursor: "pointer",
                      transition: "background-color 180ms ease",
                      "&:hover": { bgcolor: "rgba(239,246,255,.72)" },
                    }}
                  >
                    <TableCell>{formatDate(report.report_date)}</TableCell>
                    <TableCell>
                      <Typography noWrap sx={{ maxWidth: 360, fontWeight: 800, color: tokens.navy }}>
                        {report.purpose || "未填写出差事由"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {report.department || "未填部门"}
                      </Typography>
                    </TableCell>
                    <TableCell>{report.employee_name || "未填出差人"}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={900} color={tokens.primaryDeep} sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatAmount(report.total_amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <StatusPill status={report.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </GlassCard>
  );
}
