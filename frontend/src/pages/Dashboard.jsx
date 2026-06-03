import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Grid, Stack, Typography } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArticleIcon from "@mui/icons-material/Article";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { Link as RouterLink } from "react-router-dom";
import RecentReimbursements from "../components/dashboard/RecentReimbursements";
import StatusDonutChart from "../components/dashboard/StatusDonutChart";
import SystemHealthPill from "../components/dashboard/SystemHealthPill";
import TrendChart from "../components/dashboard/TrendChart";
import ReimbursementDrawer from "../components/ReimbursementDrawer";
import MetricCard from "../components/ui/MetricCard";
import MotionPage from "../components/ui/MotionPage";
import { getHealth, getStatsSummary } from "../api/client";
import { buildMonthlyTrendData, buildStatusData, filterRecentReports, getFilterLabel } from "../utils/reimbursementStats";
import { tokens } from "../theme";

const metricConfig = [
  {
    key: "month-amount",
    title: "本月报销金额",
    description: "本月已记录的报销总额",
    filter: "month",
    valueKey: "month_amount",
    prefix: "¥",
    decimals: 2,
    icon: <AccountBalanceWalletIcon />,
    color: tokens.primary,
  },
  {
    key: "month-count",
    title: "本月报销单数",
    description: "本月创建的报销单数量",
    filter: "month",
    valueKey: "month_count",
    icon: <ArticleIcon />,
    color: tokens.info,
  },
  {
    key: "pending-invoices",
    title: "待确认发票",
    description: "需要补充或确认的发票数量",
    filter: "pending",
    valueKey: "pending_invoice_count",
    icon: <ErrorOutlineIcon />,
    color: tokens.warning,
  },
  {
    key: "year-amount",
    title: "今年累计金额",
    description: "今年累计报销金额",
    filter: "year",
    valueKey: "year_amount",
    prefix: "¥",
    decimals: 2,
    icon: <TrendingUpIcon />,
    color: tokens.success,
  },
];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [drawerReport, setDrawerReport] = useState(null);
  const [refreshedAt, setRefreshedAt] = useState("");

  const loadHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await getHealth();
      setHealth(res);
    } catch (err) {
      setHealth({ success: false, message: err.message });
    } finally {
      setHealthLoading(false);
    }
  };

  const loadSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getStatsSummary();
      if (res.success) {
        setSummary(res.data);
        setRefreshedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
      } else {
        setError(res.message || "加载驾驶舱失败");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "加载驾驶舱失败");
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([loadSummary(), loadHealth()]);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const recentReports = summary?.recent_reports || [];
  const statusData = useMemo(() => buildStatusData(summary), [summary]);
  const trendData = useMemo(() => buildMonthlyTrendData(recentReports), [recentReports]);
  const filteredReports = useMemo(() => filterRecentReports(recentReports, activeFilter), [activeFilter, recentReports]);
  const filterLabel = useMemo(() => getFilterLabel(activeFilter, statusData), [activeFilter, statusData]);
  const activeStatusFilter = statusData.some((item) => item.key === activeFilter) ? activeFilter : "all";
  const syncing = loading || healthLoading;

  const toggleFilter = (filter) => {
    setActiveFilter((current) => (current === filter ? "all" : filter));
  };

  return (
    <MotionPage>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} alignItems={{ md: "center" }}>
          <Box>
            <Typography variant="h5">总览驾驶舱</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              实时查看报销金额、单据状态、待确认发票与本月趋势
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <SystemHealthPill health={health} loading={syncing} onRefresh={loadHealth} refreshedAt={refreshedAt} />
            <Button
              startIcon={<RefreshIcon sx={{ animation: syncing ? "spin 900ms linear infinite" : "none" }} />}
              variant="outlined"
              onClick={refreshAll}
              disabled={syncing}
              sx={{
                "@keyframes spin": { to: { transform: "rotate(360deg)" } },
                "@media (prefers-reduced-motion: reduce)": {
                  "& .MuiSvgIcon-root": { animation: "none !important" },
                },
              }}
            >
              {syncing ? "同步中..." : "刷新"}
            </Button>
            <Button component={RouterLink} to="/reports/new" variant="contained" startIcon={<AddCircleOutlineIcon />}>
              新建报销单
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Grid container spacing={2.2}>
          {metricConfig.map((metric, index) => (
            <Grid item xs={12} sm={6} lg={3} key={metric.key}>
              <Box
                sx={{
                  animation: "pageIn 240ms ease both",
                  animationDelay: `${index * 55}ms`,
                  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                }}
              >
                <MetricCard
                  title={metric.title}
                  value={summary?.[metric.valueKey]}
                  prefix={metric.prefix}
                  decimals={metric.decimals}
                  description={metric.description}
                  icon={metric.icon}
                  color={metric.color}
                  loading={loading}
                  selected={activeFilter === metric.filter}
                  onClick={() => toggleFilter(metric.filter)}
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.2} alignItems="stretch">
          <Grid item xs={12} lg={8}>
            <TrendChart data={trendData} loading={loading} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <StatusDonutChart
              data={statusData}
              loading={loading}
              activeFilter={activeStatusFilter}
              onFilterChange={setActiveFilter}
            />
          </Grid>
        </Grid>

        <RecentReimbursements
          reports={filteredReports}
          activeFilter={activeFilter}
          filterLabel={filterLabel}
          onClearFilter={() => setActiveFilter("all")}
          onOpenReport={setDrawerReport}
        />
      </Stack>
      <ReimbursementDrawer report={drawerReport} open={Boolean(drawerReport)} onClose={() => setDrawerReport(null)} />
    </MotionPage>
  );
}
