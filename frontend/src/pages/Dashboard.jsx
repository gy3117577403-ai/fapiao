import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getStatsSummary } from "../api/client";

const STATUS_META = {
  draft: { label: "草稿", color: "default" },
  printed: { label: "已打印", color: "info" },
  reimbursed: { label: "已报销", color: "success" },
};

const formatAmount = (value) =>
  `¥${Number(value ?? 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getStatsSummary();
      if (res.success) {
        setSummary(res.data);
      } else {
        setError(res.message || "加载看板失败");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "加载看板失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const statusData = useMemo(
    () => [
      { name: "草稿", value: summary?.draft_count ?? 0 },
      { name: "已打印", value: summary?.printed_count ?? 0 },
      { name: "已报销", value: summary?.reimbursed_count ?? 0 },
    ],
    [summary],
  );

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" fontWeight={700}>总览看板</Typography>
        <Button startIcon={<RefreshIcon />} variant="outlined" onClick={loadSummary} disabled={loading}>
          刷新
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={3}>
        {[
          ["本月报销金额", formatAmount(summary?.month_amount)],
          ["本月报销单数", summary?.month_count ?? 0],
          ["今年报销金额", formatAmount(summary?.year_amount)],
          ["待确认发票", summary?.pending_invoice_count ?? 0],
        ].map(([label, value]) => (
          <Grid item xs={12} md={3} key={label}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>{label}</Typography>
                <Typography variant="h4">{loading ? <CircularProgress size={28} /> : value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>状态分布</Typography>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 12, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1A56DB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="h6" fontWeight={700}>最近报销单</Typography>
                <Button component={RouterLink} to="/reports/new" variant="contained" size="small">
                  新增
                </Button>
              </Stack>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>报销日期</TableCell>
                    <TableCell>出差事由</TableCell>
                    <TableCell align="right">金额</TableCell>
                    <TableCell align="center">状态</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(summary?.recent_reports || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">暂无数据</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    summary.recent_reports.map((report) => {
                      const meta = STATUS_META[report.status] || { label: report.status, color: "default" };
                      return (
                        <TableRow
                          key={report.id}
                          hover
                          onClick={() => navigate(`/reports/${report.id}/edit`)}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell>{report.report_date || "—"}</TableCell>
                          <TableCell>{report.purpose || "—"}</TableCell>
                          <TableCell align="right">{formatAmount(report.total_amount)}</TableCell>
                          <TableCell align="center">
                            <Chip size="small" color={meta.color} label={meta.label} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
