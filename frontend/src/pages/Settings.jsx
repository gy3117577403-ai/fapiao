import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import GlassCard from "../components/ui/GlassCard";
import MotionPage from "../components/ui/MotionPage";
import { getSettings, updateSettings } from "../api/client";
import { tokens } from "../theme";

export default function Settings() {
  const [form, setForm] = useState({ department: "", employee_name: "", daily_subsidy: "0.00" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getSettings();
      if (res.success) {
        setForm({
          department: res.data?.department || "",
          employee_name: res.data?.employee_name || "",
          daily_subsidy: Number(res.data?.daily_subsidy ?? 0).toFixed(2),
        });
      } else {
        setError(res.message || "加载设置失败");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "加载设置失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setSuccess("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await updateSettings(form);
      if (res.success) {
        setSuccess("已保存，后续新建报销单会自动带入这些默认值");
      } else {
        setError(res.message || "保存失败");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MotionPage>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5">基础设置</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            管理部门、出差人和每日补贴标准，新建报销单时会自动带入
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <GlassCard>
          {loading ? (
            <Stack alignItems="center" sx={{ py: 5 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="部门" value={form.department} onChange={handleChange("department")} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="出差人" value={form.employee_name} onChange={handleChange("employee_name")} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="每日补贴"
                    type="number"
                    value={form.daily_subsidy}
                    onChange={handleChange("daily_subsidy")}
                    InputProps={{ startAdornment: <InputAdornment position="start">¥</InputAdornment> }}
                    inputProps={{ min: 0, step: "0.01" }}
                  />
                </Grid>
              </Grid>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  金额会按两位小数保存，报销单总额继续由现有业务逻辑计算。
                </Typography>
                <Button startIcon={<SaveIcon />} variant="contained" onClick={handleSave} disabled={saving} sx={{ minWidth: 120 }}>
                  {saving ? "保存中..." : "保存"}
                </Button>
              </Stack>
            </Stack>
          )}
        </GlassCard>

        <GlassCard sx={{ bgcolor: "rgba(239,246,255,.72)" }}>
          <Typography variant="h6" color={tokens.primaryDeep}>
            实战提示
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            修改这里不会影响已创建的报销单，只会影响之后新建报销单的默认值。
          </Typography>
        </GlassCard>
      </Stack>
    </MotionPage>
  );
}
