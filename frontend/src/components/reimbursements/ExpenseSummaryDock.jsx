import { useEffect, useRef, useState } from "react";
import { Button, Divider, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import AnimatedNumber from "../ui/AnimatedNumber";
import GlassCard from "../ui/GlassCard";
import { tokens } from "../../theme";
import SaveStatusIndicator from "./SaveStatusIndicator";

const trackedKeys = [
  "advance",
  "subsidyDays",
  "subsidyTotal",
  "invoiceTotal",
  "otherFeeTotal",
  "total",
  "shortfall",
  "surplus",
];

function SummaryRow({ label, value, suffix = "", changed = false, strong = false, tone = "default" }) {
  const color =
    tone === "success" ? tokens.success : tone === "warning" ? tokens.warning : strong ? tokens.primaryDeep : tokens.navy;
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        px: 1.2,
        py: strong ? 1.2 : 0.75,
        borderRadius: 2,
        bgcolor: changed ? "rgba(37,99,235,.1)" : strong ? "rgba(239,246,255,.78)" : "transparent",
        border: strong ? "1px solid rgba(37,99,235,.16)" : "1px solid transparent",
        transition: "background-color 800ms ease, transform 240ms ease, border-color 240ms ease",
        transform: changed && strong ? "scale(1.01)" : "scale(1)",
      }}
    >
      <Typography color={strong ? tokens.navy : "text.secondary"} fontWeight={strong ? 800 : 650}>
        {label}
      </Typography>
      <Typography
        fontWeight={strong ? 950 : 850}
        color={color}
        sx={{ fontSize: strong ? 26 : 15, lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}
      >
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
  summary,
  saveState,
  saving,
  readonly,
  isEdit,
  onBack,
  onSave,
  onSaveAndPrint,
  onPrint,
}) {
  const previous = useRef(summary);
  const [changed, setChanged] = useState(new Set());

  useEffect(() => {
    const nextChanged = new Set();
    trackedKeys.forEach((key) => {
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
    <GlassCard
      sx={{
        position: { xl: "sticky" },
        top: { xl: 88 },
        alignSelf: "flex-start",
      }}
      contentSx={{ p: 2.5 }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6">费用汇总</Typography>
          <Typography variant="body2" color="text.secondary">
            根据当前表单、行程和已确认发票实时计算
          </Typography>
        </Stack>

        <SaveStatusIndicator state={saveState} />

        <Divider />

        <Stack spacing={0.65}>
          <SummaryRow label="预借金额" value={summary.advance} changed={changed.has("advance")} />
          <SummaryRow label="补贴天数" value={summary.subsidyDays} suffix="天" changed={changed.has("subsidyDays")} />
          <SummaryRow label="途中补贴" value={summary.subsidyTotal} changed={changed.has("subsidyTotal")} />
          <SummaryRow label="发票金额" value={summary.invoiceTotal} changed={changed.has("invoiceTotal")} />
          <SummaryRow label="其他费用" value={summary.otherFeeTotal || 0} changed={changed.has("otherFeeTotal")} />
        </Stack>

        <Divider />

        <Stack spacing={0.75}>
          <SummaryRow label="报销总金额" value={summary.total} strong changed={changed.has("total")} />
          <SummaryRow label="应补" value={summary.shortfall} tone="success" changed={changed.has("shortfall")} />
          <SummaryRow label="应退" value={summary.surplus} tone="warning" changed={changed.has("surplus")} />
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Button startIcon={<SaveIcon />} variant="contained" disabled={saving || readonly} onClick={onSave}>
            {saving ? "保存中..." : isEdit ? "保存修改" : "保存草稿"}
          </Button>
          <Button
            startIcon={<SendIcon />}
            variant="outlined"
            disabled={saving || readonly}
            onClick={onSaveAndPrint}
          >
            {isEdit ? "保存并打印" : "保存并打印预览"}
          </Button>
          <Button startIcon={<PrintIcon />} variant="outlined" disabled={!isEdit} onClick={onPrint}>
            打印预览
          </Button>
          <Button startIcon={<ArrowBackIcon />} variant="text" onClick={onBack}>
            返回列表
          </Button>
        </Stack>
      </Stack>
    </GlassCard>
  );
}
