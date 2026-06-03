import { Link as RouterLink } from "react-router-dom";
import {
  Button,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EmptyState from "../ui/EmptyState";
import GlassCard from "../ui/GlassCard";
import StatusPill from "../ui/StatusPill";
import { formatAmount, formatDate } from "../../utils/formatters";
import { hasActiveReimbursementFilters, normalizeReimbursement } from "../../utils/reimbursementList";
import { tokens } from "../../theme";

const stopAndRun = (event, action) => {
  event.stopPropagation();
  action();
};

function LoadingRows() {
  return Array.from({ length: 6 }).map((_item, index) => (
    <TableRow key={`loading-${index}`}>
      {Array.from({ length: 9 }).map((_cell, cellIndex) => (
        <TableCell key={cellIndex}>
          <Skeleton height={24} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

export default function ReimbursementTable({
  records,
  filters,
  loading,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  onOpen,
  onEdit,
  onPrint,
  onDelete,
  onResetFilters,
}) {
  const hasFilters = hasActiveReimbursementFilters(filters);
  const isInitialLoading = loading && totalCount === 0;

  return (
    <GlassCard contentSx={{ p: 0, "&:last-child": { pb: 0 } }}>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 1080 }}>
          <TableHead>
            <TableRow>
              <TableCell>报销日期</TableCell>
              <TableCell>出差人</TableCell>
              <TableCell>部门</TableCell>
              <TableCell>出差事由</TableCell>
              <TableCell align="center">补贴天数</TableCell>
              <TableCell align="right">发票金额</TableCell>
              <TableCell align="right">报销总金额</TableCell>
              <TableCell align="center">状态</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isInitialLoading ? (
              <LoadingRows />
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  {hasFilters ? (
                    <EmptyState
                      title="没有找到匹配的报销单"
                      description="调整关键词、日期或状态后再试。"
                      actionText="清除筛选"
                      onAction={onResetFilters}
                    />
                  ) : (
                    <EmptyState
                      title="暂无报销单"
                      description="创建第一张报销单后，你可以在这里筛选、编辑、打印和归档。"
                      actionText="新建报销单"
                      actionTo="/reports/new"
                      actionComponent={RouterLink}
                    />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              records.map((record, index) => {
                const report = normalizeReimbursement(record);
                return (
                  <TableRow
                    key={report.id}
                    hover
                    onClick={() => onOpen(record)}
                    sx={{
                      height: 56,
                      cursor: "pointer",
                      opacity: loading ? 0.62 : 1,
                      transition: "opacity 180ms ease, background-color 180ms ease",
                      animation: "pageIn 220ms ease both",
                      animationDelay: `${Math.min(index * 28, 220)}ms`,
                      "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                      "&:hover": { bgcolor: "rgba(239,246,255,.72)" },
                    }}
                  >
                    <TableCell>{formatDate(report.reportDate, "—")}</TableCell>
                    <TableCell>{report.employeeName || "—"}</TableCell>
                    <TableCell>{report.department || "—"}</TableCell>
                    <TableCell>
                      <Typography noWrap title={report.purpose || ""} sx={{ maxWidth: 280, fontWeight: 800, color: tokens.navy }}>
                        {report.purpose || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{report.subsidyDays || 0}</TableCell>
                    <TableCell align="right">{formatAmount(report.invoiceAmount)}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={900} color={tokens.primaryDeep} sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatAmount(report.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <StatusPill status={report.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.25} justifyContent="flex-end" flexWrap="nowrap">
                        <Button size="small" startIcon={<VisibilityIcon />} onClick={(event) => stopAndRun(event, () => onOpen(record))}>
                          查看
                        </Button>
                        <Button size="small" startIcon={<EditIcon />} onClick={(event) => stopAndRun(event, () => onEdit(record))}>
                          编辑
                        </Button>
                        <Button size="small" startIcon={<PrintIcon />} onClick={(event) => stopAndRun(event, () => onPrint(record))}>
                          打印
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          disabled={report.status !== "draft"}
                          onClick={(event) => stopAndRun(event, () => onDelete(record))}
                          sx={{
                            color: tokens.muted,
                            "&:hover": { color: tokens.danger, bgcolor: "rgba(239,68,68,.08)" },
                          }}
                        >
                          删除
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(_event, newPage) => onPageChange(newPage)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(event) => onPageSizeChange(parseInt(event.target.value, 10))}
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="每页行数"
      />
    </GlassCard>
  );
}
