import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Grid,
  IconButton,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ArticleIcon from "@mui/icons-material/Article";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import ReimbursementDrawer from "../components/ReimbursementDrawer";
import DataVizCard from "../components/ui/DataVizCard";
import EmptyState from "../components/ui/EmptyState";
import GlassCard from "../components/ui/GlassCard";
import MetricCard from "../components/ui/MetricCard";
import MotionPage from "../components/ui/MotionPage";
import StatusPill from "../components/ui/StatusPill";
import { getHealth, getStatsSummary } from "../api/client";
import { tokens } from "../theme";

const moneyNumber = (value) => Number(value ?? 0);
const formatAmount = (value) =>
  `¥${moneyNumber(value).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusColors = {
  draft: tokens.muted,
  printed: tokens.info,
  reimbursed: tokens.success,
  pending: tokens.warning,
};

function SystemStatus({ health, loading, onRefresh, refreshedAt }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const ok = health?.success;
  return (
    <>
      <Button
        size="small"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          bgcolor: ok ? "rgba(22,163,74,.1)" : "rgba(245,158,11,.12)",
          color: ok ? tokens.success : tokens.warning,
          border: `1px solid ${ok ? "rgba(22,163,74,.2)" : "rgba(245,158,11,.24)"}`,
        }}
      >
        系统状态：{ok ? "正常" : loading ? "检查中" : "待确认"}
      </Button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { p: 2, width: 340, borderRadius: 3, border: `1px solid ${tokens.border}` } }}
      >
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">系统状态</Typography>
            <Tooltip title="重新检查">
              <span>
                <IconButton aria-label="重新检查系统状态" size="small" onClick={onRefresh} disabled={loading}>
                  <RefreshIcon sx={{ animation: loading ? "spin 800ms linear infinite" : "none" }} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">后端</Typography>
            <StatusPill status={ok ? "ok" : "pending"} label={ok ? "后端正常" : "等待响应"} />
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">数据库</Typography>
            <StatusPill status={ok ? "ok" : "pending"} label={health?.data?.database ? "数据库正常" : "待确认"} />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
            路径：{health?.data?.database || "尚未返回"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            最近刷新：{refreshedAt || "—"}
          </Typography>
        </Stack>
      </Popover>
    </>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
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

  const statusData = useMemo(
    () => [
      { key: "draft", name: "草稿", value: summary?.draft_count ?? 0 },
      { key: "printed", name: "已打印", value: summary?.printed_count ?? 0 },
      { key: "reimbursed", name: "已报销", value: summary?.reimbursed_count ?? 0 },
      { key: "pending", name: "待确认发票", value: summary?.pending_invoice_count ?? 0 },
    ],
    [summary],
  );

  const hasStatusData = statusData.some((item) => item.value > 0);

  const trendData = useMemo(() => {
    const grouped = new Map();
    (summary?.recent_reports || []).forEach((report) => {
      const day = report.report_date || "未填日期";
      const current = grouped.get(day) || { date: day, amount: 0, count: 0 };
      current.amount += moneyNumber(report.total_amount);
      current.count += 1;
      grouped.set(day, current);
    });
    return [...grouped.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [summary]);

  const filteredReports = useMemo(() => {
    const reports = summary?.recent_reports || [];
    if (activeFilter === "all") return reports;
    if (activeFilter === "pending") {
      return reports.filter((report) => (report.invoices || []).some((invoice) => !invoice.amount_confirmed));
    }
    return reports.filter((report) => report.status === activeFilter);
  }, [activeFilter, summary]);

  const metrics = [
    {
      title: "本月报销金额",
      value: summary?.month_amount,
      prefix: "¥",
      decimals: 2,
      subtitle: `${summary?.month_count ?? 0} 张本月单据`,
      trend: "点击筛选",
      icon: <AccountBalanceWalletIcon />,
      color: tokens.primary,
      filter: "all",
    },
    {
      title: "本月报销单数",
      value: summary?.month_count,
      subtitle: "本月新增与更新",
      trend: "实时统计",
      icon: <ArticleIcon />,
      color: tokens.info,
      filter: "all",
    },
    {
      title: "待确认发票",
      value: summary?.pending_invoice_count,
      subtitle: "需要人工确认金额",
      trend: "优先处理",
      icon: <ErrorOutlineIcon />,
      color: tokens.warning,
      filter: "pending",
    },
    {
      title: "今年累计金额",
      value: summary?.year_amount,
      prefix: "¥",
      decimals: 2,
      subtitle: `${summary?.year_count ?? 0} 张年度单据`,
      trend: "年度累计",
      icon: <TrendingUpIcon />,
      color: tokens.success,
      filter: "all",
    },
  ];

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
          <Stack direction="row" spacing={1} alignItems="center">
            <SystemStatus health={health} loading={healthLoading} onRefresh={loadHealth} refreshedAt={refreshedAt} />
            <Button
              startIcon={<RefreshIcon sx={{ animation: loading ? "spin 800ms linear infinite" : "none" }} />}
              variant="outlined"
              onClick={refreshAll}
              disabled={loading || healthLoading}
              sx={{ "@keyframes spin": { to: { transform: "rotate(360deg)" } } }}
            >
              刷新
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Grid container spacing={2.2}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} sm={6} lg={3} key={metric.title}>
              <Box sx={{ animation: "pageIn 260ms ease both", animationDelay: `${index * 50}ms` }}>
                <MetricCard {...metric} loading={loading} onClick={() => setActiveFilter(metric.filter)} />
              </Box>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.2} alignItems="stretch">
          <Grid item xs={12} lg={5}>
            <DataVizCard
              title="状态分布"
              description="点击环形图可联动筛选最近报销单"
              loading={loading}
              empty={!hasStatusData}
              emptyTitle="暂无报销数据"
              emptyDescription="创建报销单后，这里会显示草稿、已打印、已报销的状态分布。"
              emptyAction={{ label: "新建报销单", to: "/reports/new", component: RouterLink }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={72}
                    outerRadius={108}
                    paddingAngle={4}
                    onClick={(entry) => setActiveFilter(entry.key)}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.key} fill={statusColors[entry.key]} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(value, name) => [`${value} 项`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </DataVizCard>
          </Grid>

          <Grid item xs={12} lg={7}>
            <DataVizCard
              title="本月报销趋势"
              description="基于最近报销单汇总日期、金额与单据数"
              loading={loading}
              empty={trendData.length === 0}
              emptyTitle="暂无趋势数据"
              emptyDescription="新建报销单后，这里会展示按日期汇总的金额走势。"
              emptyAction={{ label: "新建报销单", to: "/reports/new", component: RouterLink }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 12, right: 16, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="amountGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={tokens.primary} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={tokens.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,.25)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `¥${value}`} />
                  <ChartTooltip formatter={(value, name) => [name === "amount" ? formatAmount(value) : `${value} 张`, name === "amount" ? "金额" : "单据数"]} />
                  <Area type="monotone" dataKey="amount" stroke={tokens.primary} fill="url(#amountGradient)" strokeWidth={3} isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </DataVizCard>
          </Grid>
        </Grid>

        <GlassCard>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
              <Box>
                <Typography variant="h6">最近报销单</Typography>
                <Typography variant="body2" color="text.secondary">
                  当前筛选：{activeFilter === "all" ? "全部" : activeFilter === "pending" ? "待确认发票" : statusData.find((item) => item.key === activeFilter)?.name}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                {activeFilter !== "all" && (
                  <Button size="small" variant="outlined" onClick={() => setActiveFilter("all")}>
                    清除筛选
                  </Button>
                )}
                <Button component={RouterLink} to="/reports/new" variant="contained" size="small">
                  新建报销单
                </Button>
              </Stack>
            </Stack>

            {filteredReports.length === 0 ? (
              <EmptyState
                title="暂无报销数据"
                description="创建报销单后，这里会展示最近的报销记录。"
                actionLabel="新建第一张报销单"
                actionTo="/reports/new"
                actionComponent={RouterLink}
              />
            ) : (
              <Stack spacing={1}>
                {filteredReports.map((report) => (
                  <Stack
                    key={report.id}
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.5}
                    alignItems={{ md: "center" }}
                    justifyContent="space-between"
                    onClick={() => setDrawerReport(report)}
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      border: `1px solid ${tokens.border}`,
                      bgcolor: "rgba(255,255,255,.62)",
                      cursor: "pointer",
                      transition: "transform 180ms ease, background-color 180ms ease",
                      "&:hover": { transform: "translateY(-1px)", bgcolor: "rgba(239,246,255,.72)" },
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={800} noWrap>{report.purpose || "未填写出差事由"}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {report.report_date || "未填日期"} · {report.employee_name || "未填出差人"} · {report.department || "未填部门"}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography fontWeight={900} color={tokens.primaryDeep}>
                        {formatAmount(report.total_amount)}
                      </Typography>
                      <StatusPill status={report.status} />
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        </GlassCard>
      </Stack>
      <ReimbursementDrawer report={drawerReport} open={Boolean(drawerReport)} onClose={() => setDrawerReport(null)} />
    </MotionPage>
  );
}
