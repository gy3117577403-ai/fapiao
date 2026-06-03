import { Box, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import DataVizCard from "../ui/DataVizCard";
import { formatAmount, formatInteger } from "../../utils/formatters";
import { tokens } from "../../theme";

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const amount = payload.find((item) => item.dataKey === "amount")?.value;
  const count = payload.find((item) => item.dataKey === "count")?.value ?? payload[0]?.payload?.count;
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: `1px solid ${tokens.border}`,
        bgcolor: "rgba(255,255,255,.94)",
        boxShadow: "0 12px 32px rgba(15,23,42,.12)",
        backdropFilter: "blur(16px)",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={900} color={tokens.primaryDeep}>
        {formatAmount(amount)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        单据数量：{formatInteger(count)} 张
      </Typography>
    </Box>
  );
}

export default function TrendChart({ data, loading }) {
  return (
    <DataVizCard
      title="本月报销趋势"
      description="基于最近报销单汇总日期、金额与单据数"
      loading={loading}
      empty={!data.length}
      emptyTitle="暂无趋势数据"
      emptyDescription="创建报销单后，这里会展示本月每日报销金额变化。"
      emptyAction={{ label: "新建报销单", to: "/reports/new", component: RouterLink }}
      height={320}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 18, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="dashboardAmountGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tokens.primary} stopOpacity={0.26} />
              <stop offset="100%" stopColor={tokens.primary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,.22)" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: tokens.muted, fontSize: 12 }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: tokens.muted, fontSize: 12 }}
            tickFormatter={(value) => `¥${formatInteger(value)}`}
            width={58}
          />
          <ChartTooltip content={<TrendTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke={tokens.primary}
            fill="url(#dashboardAmountGradient)"
            strokeWidth={3}
            animationDuration={650}
            dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
            activeDot={{ r: 5, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </DataVizCard>
  );
}
