import { useEffect, useRef, useState } from "react";
import { Button, Divider, Grid, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import AnimatedNumber from "./ui/AnimatedNumber";
import GlassCard from "./ui/GlassCard";
import { tokens } from "../theme";

const summaryKeys = ["subsidyDays", "subsidyTotal", "invoiceTotal", "total", "shortfall", "surplus"];

function SummaryRow({ label, value, suffix = "", highlight = false, strong = false }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        px: 1,
        py: 0.75,
        borderRadius: 2,
        bgcolor: highlight ? "rgba(37,99,235,.1)" : "transparent",
        transition: "background-color 800ms ease",
      }}
    >
      <Typography color={strong ? tokens.navy : "text.secondary"} fontWeight={strong ? 800 : 600}>
        {label}
      </Typography>
      <Typography fontWeight={strong ? 900 : 800} color={strong ? tokens.primaryDeep : tokens.navy}>
        {suffix === "天" ? (
          <>
            <AnimatedNumber value={value} /> 天
          </>
        ) : (
          <>
            ¥<AnimatedNumber value={value} decimals={2} />
          </>
        )}
      </Typography>
    </Stack>
  );
}

export default function ExpenseSummaryDock({
  form,
  summary,
  readonly,
  saving,
  saveLabel,
  saveState,
  onChange,
  onSave,
  onPrint,
  canPrint = false,
}) {
  const previous = useRef(summary);
  const [changed, setChanged] = useState(new Set());

  useEffect(() => {
    const nextChanged = new Set();
    summaryKeys.forEach((key) => {
      if (Number(previous.current?.[key] ?? 0) !== Number(summary?.[key] ?? 0)) nextChanged.add(key);
    });
    previous.current = summary;
    if (nextChanged.size > 0) {
      setChanged(nextChanged);
      const timer = setTimeout(() => setChanged(new Set()), 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [summary]);

  return (
    <GlassCard sx={{ position: { lg: "sticky" }, top: { lg: 88 } }}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6">费用实时汇总</Typography>
          <Typography variant="body2" color="text.secondary">
            修改行程、发票或预借金额后自动刷新
          </Typography>
        </Stack>

        <Grid container spacing={1.5}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="预借月"
              type="number"
              value={form.advance_date_month}
              disabled={readonly}
              onChange={onChange("advance_date_month")}
              inputProps={{ min: 1, max: 12 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="预借日"
              type="number"
              value={form.advance_date_day}
              disabled={readonly}
              onChange={onChange("advance_date_day")}
              inputProps={{ min: 1, max: 31 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="预借金额"
              type="number"
              value={form.advance_amount}
              disabled={readonly}
              onChange={onChange("advance_amount")}
              InputProps={{
                startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                inputProps: { min: 0, step: "0.01" },
              }}
            />
          </Grid>
        </Grid>

        <Divider />
        <Stack spacing={0.75}>
          <SummaryRow label="补贴天数" value={summary.subsidyDays} suffix="天" highlight={changed.has("subsidyDays")} />
          <SummaryRow label="途中补贴" value={summary.subsidyTotal} highlight={changed.has("subsidyTotal")} />
          <SummaryRow label="发票金额" value={summary.invoiceTotal} highlight={changed.has("invoiceTotal")} />
          <SummaryRow label="其他费用" value={summary.otherFeeTotal || 0} />
          <Divider />
          <SummaryRow label="报销总金额" value={summary.total} strong highlight={changed.has("total")} />
          <SummaryRow label="应补" value={summary.shortfall} highlight={changed.has("shortfall")} />
          <SummaryRow label="应退" value={summary.surplus} highlight={changed.has("surplus")} />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            保存状态：{saveState || "待编辑"}
          </Typography>
          <Button startIcon={<SaveIcon />} variant="contained" disabled={saving || readonly} onClick={onSave}>
            {saving ? "保存中..." : saveLabel}
          </Button>
          <Button startIcon={<PrintIcon />} variant="outlined" disabled={!canPrint} onClick={onPrint}>
            打印预览
          </Button>
        </Stack>
      </Stack>
    </GlassCard>
  );
}
