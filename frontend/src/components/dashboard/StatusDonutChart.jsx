import { Box, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip } from "recharts";
import DataVizCard from "../ui/DataVizCard";
import { formatInteger, formatPercent, toNumber } from "../../utils/formatters";
import { tokens } from "../../theme";

const STATUS_COLORS = {
  draft: tokens.muted,
  printed: tokens.info,
  reimbursed: tokens.success,
  pending: tokens.warning,
};

function StatusTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: `1px solid ${tokens.border}`,
        bgcolor: "rgba(255,255,255,.94)",
        boxShadow: "0 12px 32px rgba(15,23,42,.12)",
      }}
    >
      <Typography variant="body2" fontWeight={900}>
        {item.name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        数量：{formatInteger(item.value)}
      </Typography>
    </Box>
  );
}

export default function StatusDonutChart({ data, loading, activeFilter, onFilterChange }) {
  const total = data.reduce((sum, item) => sum + toNumber(item.value), 0);
  const reportTotal = data
    .filter((item) => item.key !== "pending")
    .reduce((sum, item) => sum + toNumber(item.value), 0);

  const toggleFilter = (key) => {
    onFilterChange(activeFilter === key ? "all" : key);
  };

  return (
    <DataVizCard
      title="状态分布"
      description="点击环形图可联动筛选最近报销单"
      loading={loading}
      empty={total === 0}
      emptyTitle="暂无报销数据"
      emptyDescription="创建报销单后，这里会显示草稿、已打印、已报销的状态分布。"
      emptyAction={{ label: "新建报销单", to: "/reports/new", component: RouterLink }}
      height={320}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ height: "100%" }} alignItems="center">
        <Box sx={{ position: "relative", width: { xs: "100%", md: 230 }, height: 240, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={72}
                outerRadius={104}
                paddingAngle={4}
                animationDuration={650}
                onClick={(entry) => toggleFilter(entry.key)}
              >
                {data.map((entry) => {
                  const active = activeFilter === entry.key;
                  return (
                    <Cell
                      key={entry.key}
                      fill={STATUS_COLORS[entry.key]}
                      stroke={active ? tokens.primaryDeep : "#fff"}
                      strokeWidth={active ? 3 : 2}
                      opacity={activeFilter === "all" || active ? 1 : 0.42}
                      style={{ cursor: "pointer" }}
                    />
                  );
                })}
              </Pie>
              <ChartTooltip content={<StatusTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            <Typography variant="h5" fontWeight={900} color={tokens.navy}>
              {formatInteger(reportTotal)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              总单据
            </Typography>
          </Stack>
        </Box>
        <Stack spacing={1} sx={{ width: "100%" }}>
          {data.map((item) => {
            const active = activeFilter === item.key;
            const percent = total > 0 ? toNumber(item.value) / total : 0;
            return (
              <Stack
                key={item.key}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                onClick={() => toggleFilter(item.key)}
                sx={{
                  px: 1.25,
                  py: 1,
                  borderRadius: 2,
                  cursor: "pointer",
                  border: `1px solid ${active ? "rgba(37,99,235,.28)" : tokens.border}`,
                  bgcolor: active ? "rgba(239,246,255,.88)" : "rgba(255,255,255,.58)",
                  transition: "background-color 180ms ease, border-color 180ms ease",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: 999,
                      bgcolor: STATUS_COLORS[item.key],
                      boxShadow: `0 0 0 4px ${STATUS_COLORS[item.key]}18`,
                    }}
                  />
                  <Typography variant="body2" fontWeight={800} noWrap>
                    {item.name}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatInteger(item.value)} · {formatPercent(percent)}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </DataVizCard>
  );
}
