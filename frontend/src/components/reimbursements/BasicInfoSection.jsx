import { Grid, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import GlassCard from "../ui/GlassCard";
import FormSectionHeader from "./FormSectionHeader";

export default function BasicInfoSection({ form, readonly, settingsLoaded, onChange, onMoneyBlur }) {
  const missing = {
    report_date: !form.report_date,
    department: !form.department,
    employee_name: !form.employee_name,
    purpose: !form.purpose,
  };

  return (
    <GlassCard>
      <Stack spacing={2}>
        <FormSectionHeader
          index={1}
          title="基本信息"
          description="报销日期、部门、出差人和补贴标准会参与后续汇总计算。"
        />
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={6} xl={3}>
            <TextField
              fullWidth
              required
              label="报销日期"
              type="date"
              value={form.report_date}
              onChange={onChange("report_date")}
              InputLabelProps={{ shrink: true }}
              error={missing.report_date}
              helperText={missing.report_date ? "请选择报销日期" : " "}
              disabled={readonly}
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={3}>
            <TextField
              fullWidth
              required
              label="部门"
              value={form.department}
              onChange={onChange("department")}
              error={missing.department}
              helperText={missing.department ? "请填写部门" : " "}
              disabled={readonly}
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={3}>
            <TextField
              fullWidth
              required
              label="出差人"
              value={form.employee_name}
              onChange={onChange("employee_name")}
              error={missing.employee_name}
              helperText={missing.employee_name ? "请填写出差人" : " "}
              disabled={readonly}
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={3}>
            <TextField
              fullWidth
              label="途中补贴标准"
              type="number"
              value={form.daily_subsidy}
              onChange={onChange("daily_subsidy")}
              onBlur={onMoneyBlur("daily_subsidy")}
              disabled={readonly}
              InputProps={{ startAdornment: <InputAdornment position="start">¥</InputAdornment> }}
              inputProps={{ min: 0, step: "0.01" }}
              helperText={settingsLoaded ? "来自基础设置，可手动调整" : "可手动调整"}
            />
          </Grid>
          <Grid item xs={12} sm={4} xl={2}>
            <TextField
              fullWidth
              label="预借月"
              type="number"
              value={form.advance_date_month}
              onChange={onChange("advance_date_month")}
              disabled={readonly}
              inputProps={{ min: 1, max: 12 }}
            />
          </Grid>
          <Grid item xs={12} sm={4} xl={2}>
            <TextField
              fullWidth
              label="预借日"
              type="number"
              value={form.advance_date_day}
              onChange={onChange("advance_date_day")}
              disabled={readonly}
              inputProps={{ min: 1, max: 31 }}
            />
          </Grid>
          <Grid item xs={12} sm={4} xl={2}>
            <TextField
              fullWidth
              label="预借金额"
              type="number"
              value={form.advance_amount}
              onChange={onChange("advance_amount")}
              onBlur={onMoneyBlur("advance_amount")}
              disabled={readonly}
              InputProps={{ startAdornment: <InputAdornment position="start">¥</InputAdornment> }}
              inputProps={{ min: 0, step: "0.01" }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="出差事由"
              value={form.purpose}
              onChange={onChange("purpose")}
              error={missing.purpose}
              helperText={missing.purpose ? "请填写出差事由" : " "}
              disabled={readonly}
              multiline
              minRows={2}
            />
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary">
          金额输入会自动规整为非负两位小数，避免异常金额。
        </Typography>
      </Stack>
    </GlassCard>
  );
}
