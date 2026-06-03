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
  Stack,
  Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import ReimbursementDrawer from "../components/ReimbursementDrawer";
import ReimbursementFilterBar from "../components/reimbursements/ReimbursementFilterBar";
import ReimbursementStatusTabs from "../components/reimbursements/ReimbursementStatusTabs";
import ReimbursementTable from "../components/reimbursements/ReimbursementTable";
import ReimbursementWorkbenchStats from "../components/reimbursements/ReimbursementWorkbenchStats";
import MotionPage from "../components/ui/MotionPage";
import { deleteReport, getReports } from "../api/client";
import {
  countByStatus,
  defaultReimbursementFilters,
  filterReimbursements,
  normalizeReimbursement,
} from "../utils/reimbursementList";

export default function ReportList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(defaultReimbursementFilters);
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

  const loadedStatusCounts = useMemo(() => countByStatus(items), [items]);
  const filteredItems = useMemo(() => filterReimbursements(items, filters), [filters, items]);
  const visibleItems = useMemo(() => {
    const start = page * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredItems.length / pageSize) - 1);
    if (page > lastPage) setPage(lastPage);
  }, [filteredItems.length, page, pageSize]);

  const updateFilters = (nextFilters) => {
    setFilters(nextFilters);
    setPage(0);
  };

  const resetFilters = () => {
    setFilters(defaultReimbursementFilters);
    setPage(0);
  };

  const handleStatusChange = (status) => {
    updateFilters({ ...filters, status });
  };

  const handlePageSizeChange = (nextPageSize) => {
    setPageSize(nextPageSize);
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

  const deleteTitle = pendingDelete ? normalizeReimbursement(pendingDelete).purpose || "未命名" : "";

  return (
    <MotionPage>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2}>
          <Box>
            <Typography variant="h5">报销单工作台</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              管理、筛选、打印和归档所有差旅报销单
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon sx={{ animation: loading ? "spin 900ms linear infinite" : "none" }} />}
              onClick={fetchReports}
              disabled={loading}
              sx={{
                "@keyframes spin": { to: { transform: "rotate(360deg)" } },
                "@media (prefers-reduced-motion: reduce)": {
                  "& .MuiSvgIcon-root": { animation: "none !important" },
                },
              }}
            >
              {loading ? "刷新中..." : "刷新"}
            </Button>
            <Button component={RouterLink} to="/reports/new" variant="contained" startIcon={<AddCircleOutlineIcon />}>
              新建报销单
            </Button>
          </Stack>
        </Stack>

        <ReimbursementWorkbenchStats
          counts={loadedStatusCounts}
          activeStatus={filters.status}
          onStatusChange={handleStatusChange}
          loading={loading && items.length === 0}
        />

        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchReports} disabled={loading}>
                重试
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        <ReimbursementFilterBar
          filters={filters}
          onFiltersChange={updateFilters}
          onReset={resetFilters}
          onSubmit={() => setPage(0)}
          filteredCount={filteredItems.length}
          totalCount={items.length}
        />

        <Stack spacing={0}>
          <ReimbursementStatusTabs value={filters.status} counts={loadedStatusCounts} onChange={handleStatusChange} />
          <ReimbursementTable
            records={visibleItems}
            filters={filters}
            loading={loading}
            page={page}
            pageSize={pageSize}
            totalCount={filteredItems.length}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            onOpen={setDrawerReport}
            onEdit={(report) => navigate(`/reports/${report.id}/edit`)}
            onPrint={(report) => navigate(`/reports/${report.id}/print`)}
            onDelete={setPendingDelete}
            onResetFilters={resetFilters}
          />
        </Stack>

        <Dialog open={Boolean(pendingDelete)} onClose={() => !deleting && setPendingDelete(null)}>
          <DialogTitle>确认删除</DialogTitle>
          <DialogContent>
            <DialogContentText>确定要删除报销单「{deleteTitle}」吗？此操作将软删除该报销单。</DialogContentText>
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
