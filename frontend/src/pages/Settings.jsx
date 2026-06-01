import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { getSettings, updateSettings } from "../api/client";

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
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await updateSettings(form);
      if (res.success) {
        setSuccess("已保存");
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
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>基础设置</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Card>
        <CardContent>
          {loading ? (
            <CircularProgress size={28} />
          ) : (
            <Grid container spacing={3}>
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
              <Grid item xs={12}>
                <Button startIcon={<SaveIcon />} variant="contained" onClick={handleSave} disabled={saving}>
                  保存
                </Button>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
