import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  InputAdornment,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import ReimbursementDrawer from "../components/ReimbursementDrawer";
import EmptyState from "../components/ui/EmptyState";
import GlassCard from "../components/ui/GlassCard";
import MotionPage from "../components/ui/MotionPage";
import StatusPill from "../components/ui/StatusPill";
import { deleteReport, getReports } from "../api/client";
import { tokens } from "../theme";

const STATUS_TABS = [
  { value: "all", label: "全部" },
  { value: "draft", label: "草稿" },
  { value: "printed", label: "已打印" },
  { value: "reimbursed", label: "已报销" },
  { value: "pending", label: "待确认发票" },
];

const formatAmount = (value) =>
  `¥${Number(value ?? 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value) => value || "—";
const invoiceAmount = (report) => Math.max(0, Number(report.total_amount || 0) - Number(report.subsidy_total || 0));
const hasPendingInvoice = (report) => (report.invoices || []).some((invoice) => !invoice.amount_confirmed);

export default function ReportList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("all");
  const [filters, setFilters] = useState({ keyword: "", startDate: "", endDate: "" });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [drawerReport, setDrawerReport] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReports({ page: 1, pageSize: 100, status: "all" });
      if (res.success) {
        setItems(res.data.items || []);
      } else {
        setError(res.message || "加载失败");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const tabCounts = useMemo(() => {
    const counts = { all: items.length, draft: 0, printed: 0, reimbursed: 0, pending: 0 };
    items.forEach((report) => {
      counts[report.status] = (counts[report.status] || 0) + 1;
      if (hasPendingInvoice(report)) counts.pending += 1;
    });
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();
    return items.filter((report) => {
      if (status === "pending" && !hasPendingInvoice(report)) return false;
      if (status !== "all" && status !== "pending" && report.status !== status) return false;
      if (filters.startDate && String(report.report_date || "") < filters.startDate) return false;
      if (filters.endDate && String(report.report_date || "") > filters.endDate) return false;
      if (!keyword) return true;
      return [report.purpose, report.employee_name, report.department].some((field) =>
        String(field || "").toLowerCase().includes(keyword),
      );
    });
  }, [filters, items, status]);

  const visibleItems = useMemo(() => {
    const start = page * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const resetFilters = () => {
    setStatus("all");
    setFilters({ keyword: "", startDate: "", endDate: "" });
    setPage(0);
  };

  const handleStatusChange = (_event, value) => {
    setStatus(value);
    setPage(0);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError("");
    try {
      const res = await deleteReport(pendingDelete.id);
      if (res.success) {
        setPendingDelete(null);
        await fetchReports();
      } else {
        setError(res.message || "删除失败");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "删除失败");
    } finally {
      setDeleting(false);
    }
  };

  const stopAndRun = (event, action) => {
    event.stopPropagation();
    action();
  };

  return (
    <MotionPage>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2}>
          <Box>
            <Typography variant="h5">报销单工作台</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              管理、筛选、打印和归档所有差旅报销单
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={fetchReports} disabled={loading}>
              刷新
            </Button>
            <Button component={RouterLink} to="/reports/new" variant="contained" startIcon={<AddCircleOutlineIcon />}>
              新建报销单
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <GlassCard>
          <Stack spacing={2}>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="搜索出差事由 / 出差人 / 部门"
                  value={filters.keyword}
                  onChange={(event) => {
                    setFilters((prev) => ({ ...prev, keyword: event.target.value }));
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  label="开始日期"
                  type="date"
                  value={filters.startDate}
                  onChange={(event) => {
                    setFilters((prev) => ({ ...prev, startDate: event.target.value }));
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  label="结束日期"
                  type="date"
                  value={filters.endDate}
                  onChange={(event) => {
                    setFilters((prev) => ({ ...prev, endDate: event.target.value }));
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack direction="row" spacing={1} justifyContent={{ md: "flex-end" }}>
                  <Button variant="contained" onClick={() => setPage(0)}>
                    查询
                  </Button>
                  <Button variant="outlined" onClick={resetFilters}>
                    重置
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </GlassCard>

        <GlassCard contentSx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Tabs
            value={status}
            onChange={handleStatusChange}
            variant="scrollable"
            sx={{ px: 2, borderBottom: `1px solid ${tokens.border}` }}
          >
            {STATUS_TABS.map((tab) => (
              <Tab key={tab.value} value={tab.value} label={`${tab.label} ${tabCounts[tab.value] ?? 0}`} />
            ))}
          </Tabs>

          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 1060 }}>
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
                {visibleItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <EmptyState
                        title="暂无报销单"
                        description="创建第一张报销单后，你可以在这里查看、编辑、打印和归档。"
                        actionLabel="新建报销单"
                        actionTo="/reports/new"
                        actionComponent={RouterLink}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleItems.map((report, index) => (
                    <TableRow
                      key={report.id}
                      hover
                      onClick={() => setDrawerReport(report)}
                      sx={{
                        cursor: "pointer",
                        opacity: loading ? 0.56 : 1,
                        transition: "opacity 180ms ease, transform 180ms ease, background-color 180ms ease",
                        animation: "pageIn 240ms ease both",
                        animationDelay: `${Math.min(index * 35, 260)}ms`,
                        "&:hover": { bgcolor: "rgba(239,246,255,.58)", transform: "translateY(-1px)" },
                      }}
                    >
                      <TableCell>{formatDate(report.report_date)}</TableCell>
                      <TableCell>{report.employee_name || "—"}</TableCell>
                      <TableCell>{report.department || "—"}</TableCell>
                      <TableCell>
                        <Typography noWrap sx={{ maxWidth: 240, fontWeight: 700 }}>
                          {report.purpose || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{report.subsidy_days ?? 0}</TableCell>
                      <TableCell align="right">{formatAmount(invoiceAmount(report))}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={900} color={tokens.primaryDeep}>
                          {formatAmount(report.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <StatusPill status={report.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Button size="small" startIcon={<VisibilityIcon />} onClick={(event) => stopAndRun(event, () => setDrawerReport(report))}>
                            查看
                          </Button>
                          <Button size="small" startIcon={<EditIcon />} onClick={(event) => stopAndRun(event, () => navigate(`/reports/${report.id}/edit`))}>
                            编辑
                          </Button>
                          <Button size="small" startIcon={<PrintIcon />} onClick={(event) => stopAndRun(event, () => navigate(`/reports/${report.id}/print`))}>
                            打印
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            disabled={report.status !== "draft"}
                            onClick={(event) => stopAndRun(event, () => setPendingDelete(report))}
                          >
                            删除
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredItems.length}
            page={page}
            onPageChange={(_event, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(event) => {
              setPageSize(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="每页行数"
          />
        </GlassCard>

        <Dialog open={Boolean(pendingDelete)} onClose={() => !deleting && setPendingDelete(null)}>
          <DialogTitle>确认删除</DialogTitle>
          <DialogContent>
            <DialogContentText>
              确定要删除报销单「{pendingDelete?.purpose || "未命名"}」吗？此操作将软删除该报销单。
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPendingDelete(null)} disabled={deleting}>
              取消
            </Button>
            <Button onClick={handleConfirmDelete} color="error" disabled={deleting}>
              {deleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogActions>
        </Dialog>

        <ReimbursementDrawer report={drawerReport} open={Boolean(drawerReport)} onClose={() => setDrawerReport(null)} />
      </Stack>
    </MotionPage>
  );
}
