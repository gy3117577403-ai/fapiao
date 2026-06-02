import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import ExpenseSummaryDock from "../components/ExpenseSummaryDock";
import InvoiceUploader from "../components/InvoiceUploader";
import InvoiceViewer from "../components/InvoiceViewer";
import TripTimeline from "../components/TripTimeline";
import EmptyState from "../components/ui/EmptyState";
import GlassCard from "../components/ui/GlassCard";
import MotionPage from "../components/ui/MotionPage";
import StatusPill from "../components/ui/StatusPill";
import {
  createReport,
  deleteInvoice,
  getReport,
  getSettings,
  updateReport,
  updateReportStatus,
  uploadInvoice,
} from "../api/client";
import { tokens } from "../theme";

const STATUS_ACTIONS = {
  draft: [{ target: "printed", label: "标记为已打印", color: "primary" }],
  printed: [
    { target: "reimbursed", label: "标记为已报销", color: "success" },
    { target: "draft", label: "退回草稿", color: "inherit" },
  ],
  reimbursed: [],
};

const EXPENSE_CATEGORIES = [
  { value: "luggage", label: "行李费" },
  { value: "city_transport", label: "市内交通费" },
  { value: "accommodation", label: "住宿费" },
  { value: "postal", label: "邮电费" },
  { value: "no_sleeper_subsidy", label: "未乘卧铺补助" },
  { value: "toll", label: "过路费" },
  { value: "fuel_subsidy", label: "燃油补助" },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  report_date: todayStr(),
  department: "",
  employee_name: "",
  purpose: "",
  daily_subsidy: "0.00",
  advance_date_month: "",
  advance_date_day: "",
  advance_amount: "0.00",
};

const formatAmount = (value) =>
  `¥${Number(value ?? 0).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const toMoney = (value) => Number(value || 0).toFixed(2);

const normalizeTrip = (trip, index) => ({
  id: trip.id ?? null,
  sort_order: index + 1,
  depart_month: trip.depart_month ?? 1,
  depart_day: trip.depart_day ?? 1,
  depart_hour: trip.depart_hour ?? "",
  depart_place: trip.depart_place ?? "",
  arrive_month: trip.arrive_month ?? 1,
  arrive_day: trip.arrive_day ?? 1,
  arrive_hour: trip.arrive_hour ?? "",
  arrive_place: trip.arrive_place ?? "",
  transport: trip.transport ?? "",
});

const makeBlankTrip = (reportDate) => {
  const date = reportDate ? new Date(`${reportDate}T00:00:00`) : new Date();
  const month = Number.isNaN(date.getTime()) ? 1 : date.getMonth() + 1;
  const day = Number.isNaN(date.getTime()) ? 1 : date.getDate();
  return normalizeTrip({ depart_month: month, depart_day: day, arrive_month: month, arrive_day: day }, 0);
};

const normalizeExpenseItem = (item) => ({
  id: item.id ?? null,
  category: item.category,
  remark: item.remark ?? "",
  amount: item.amount ?? "0.00",
  invoice_count: item.invoice_count ?? 0,
});

const makeDate = (year, month, day) => {
  const parsed = new Date(year, month - 1, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;
  return parsed;
};

const calculateSubsidyDays = (reportDate, trips) => {
  const year = reportDate ? new Date(`${reportDate}T00:00:00`).getFullYear() : new Date().getFullYear();
  const ranges = trips
    .map((trip) => {
      const departMonth = Number(trip.depart_month);
      const departDay = Number(trip.depart_day);
      const arriveMonth = Number(trip.arrive_month);
      const arriveDay = Number(trip.arrive_day);
      const arriveYear =
        arriveMonth < departMonth || (arriveMonth === departMonth && arriveDay < departDay) ? year + 1 : year;
      const depart = makeDate(year, departMonth, departDay);
      const arrive = makeDate(arriveYear, arriveMonth, arriveDay);
      return depart && arrive ? { depart, arrive } : null;
    })
    .filter(Boolean);

  if (ranges.length === 0) return 0;
  const earliest = Math.min(...ranges.map((range) => range.depart.getTime()));
  const latest = Math.max(...ranges.map((range) => range.arrive.getTime()));
  return Math.max(0, Math.floor((latest - earliest) / 86400000) + 1);
};

function SectionTitle({ title, description }) {
  return (
    <Box>
      <Typography variant="h6">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}

export default function ReportEdit() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("draft");
  const [trips, setTrips] = useState([]);
  const [expenseItems, setExpenseItems] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [saveState, setSaveState] = useState("待保存");

  const readonly = status === "reimbursed";

  const loadForEdit = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) setLoading(true);
      setError("");
      try {
        const res = await getReport(id);
        if (res.success) {
          const r = res.data;
          setForm({
            report_date: r.report_date || todayStr(),
            department: r.department || "",
            employee_name: r.employee_name || "",
            purpose: r.purpose || "",
            daily_subsidy: toMoney(r.daily_subsidy),
            advance_date_month: r.advance_date_month || "",
            advance_date_day: r.advance_date_day || "",
            advance_amount: toMoney(r.advance_amount),
          });
          setStatus(r.status);
          setTrips([...(r.trips || [])].sort((a, b) => a.sort_order - b.sort_order).map(normalizeTrip));
          setExpenseItems((r.expense_items || []).map(normalizeExpenseItem));
          setInvoices(r.invoices || []);
          setSaveState("已同步");
        } else {
          setError(res.message || "加载报销单失败");
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || "加载报销单失败");
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [id],
  );

  const loadDefaults = useCallback(async () => {
    try {
      const res = await getSettings();
      if (res.success && res.data) {
        setForm((prev) => ({
          ...prev,
          department: res.data.department || "",
          employee_name: res.data.employee_name || "",
          daily_subsidy: toMoney(res.data.daily_subsidy),
        }));
      }
    } catch {
      // 设置读取失败不阻塞新增，使用空默认值
    }
  }, []);

  useEffect(() => {
    if (isEdit) {
      loadForEdit();
    } else {
      setTrips([]);
      setExpenseItems(EXPENSE_CATEGORIES.map((item) => normalizeExpenseItem({ category: item.value })));
      setInvoices([]);
      loadDefaults();
    }
  }, [isEdit, loadForEdit, loadDefaults]);

  const summary = useMemo(() => {
    const subsidyDays = calculateSubsidyDays(form.report_date, trips);
    const subsidyTotal = subsidyDays * Number(form.daily_subsidy || 0);
    const confirmedInvoices = invoices.filter((invoice) => invoice.amount_confirmed);
    const invoiceTotal = confirmedInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    const otherFeeTotal = confirmedInvoices
      .filter((invoice) => invoice.expense_category !== "transport_fare")
      .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    const total = subsidyTotal + invoiceTotal;
    const advance = Number(form.advance_amount || 0);
    return {
      subsidyDays,
      subsidyTotal,
      invoiceTotal,
      otherFeeTotal,
      total,
      shortfall: Math.max(0, total - advance),
      surplus: Math.max(0, advance - total),
    };
  }, [form.advance_amount, form.daily_subsidy, form.report_date, invoices, trips]);

  const actions = STATUS_ACTIONS[status] || [];

  const markDirty = () => setSaveState("有未保存修改");

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    markDirty();
  };

  const buildTripPayload = () =>
    trips.map((trip, index) => ({
      id: trip.id || null,
      sort_order: index + 1,
      depart_month: Number(trip.depart_month || 1),
      depart_day: Number(trip.depart_day || 1),
      depart_hour: trip.depart_hour === "" ? null : Number(trip.depart_hour),
      depart_place: trip.depart_place?.trim() || null,
      arrive_month: Number(trip.arrive_month || 1),
      arrive_day: Number(trip.arrive_day || 1),
      arrive_hour: trip.arrive_hour === "" ? null : Number(trip.arrive_hour),
      arrive_place: trip.arrive_place?.trim() || null,
      transport: trip.transport?.trim() || null,
    }));

  const buildPayload = () => ({
    report_date: form.report_date || null,
    department: form.department.trim() || null,
    employee_name: form.employee_name.trim() || null,
    purpose: form.purpose.trim() || null,
    daily_subsidy: form.daily_subsidy === "" ? "0.00" : form.daily_subsidy,
    advance_date_month: form.advance_date_month === "" ? null : Number(form.advance_date_month),
    advance_date_day: form.advance_date_day === "" ? null : Number(form.advance_date_day),
    advance_amount: form.advance_amount === "" ? "0.00" : form.advance_amount,
    trips: buildTripPayload(),
    expense_items: expenseItems.map((item) => ({
      id: item.id || null,
      category: item.category,
      remark: item.remark?.trim() || null,
    })),
  });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaveState("保存中");
    try {
      const payload = buildPayload();
      if (isEdit) {
        const res = await updateReport(id, payload);
        if (res.success) {
          setToast("已保存");
          setSaveState("已保存");
          await loadForEdit({ quiet: true });
        } else {
          setSaveState("保存失败，点击重试");
          setError(res.message || "保存失败");
        }
      } else {
        const res = await createReport(payload);
        if (res.success) {
          setToast("草稿已创建");
          setSaveState("已保存");
          navigate(`/reports/${res.data.id}/edit`, { replace: true });
        } else {
          setSaveState("保存失败，点击重试");
          setError(res.message || "创建失败");
        }
      }
    } catch (err) {
      setSaveState("保存失败，点击重试");
      setError(err.response?.data?.message || err.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusAction = async (target) => {
    setSaving(true);
    setError("");
    try {
      const res = await updateReportStatus(id, target);
      if (res.success) {
        setStatus(res.data.status);
        setToast("状态已更新");
      } else {
        setError(res.message || "状态更新失败");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "状态更新失败");
    } finally {
      setSaving(false);
    }
  };

  const updateTrip = (index, field, value) => {
    setTrips((prev) => prev.map((trip, i) => (i === index ? { ...trip, [field]: value } : trip)));
    markDirty();
  };

  const addTrip = () => {
    setTrips((prev) => [...prev, normalizeTrip(makeBlankTrip(form.report_date), prev.length)]);
    markDirty();
  };

  const removeTrip = (index) => {
    setTrips((prev) => prev.filter((_trip, i) => i !== index).map(normalizeTrip));
    markDirty();
  };

  const moveTrip = (from, to) => {
    if (to < 0 || to >= trips.length || from === to) return;
    setTrips((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next.map(normalizeTrip);
    });
    markDirty();
  };

  const updateExpenseItem = (category, value) => {
    setExpenseItems((prev) => prev.map((item) => (item.category === category ? { ...item, remark: value } : item)));
    markDirty();
  };

  const invoicesForTrip = (tripId) => invoices.filter((invoice) => invoice.trip_id === tripId);
  const invoicesForCategory = (category) => invoices.filter((invoice) => invoice.expense_category === category && !invoice.trip_id);

  const handleUpload = async ({ event, expenseCategory, tripId = null, key }) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(key);
    setError("");
    try {
      const res = await uploadInvoice({ reportId: id, tripId, expenseCategory, file });
      if (res.success) {
        setToast(res.data.amount_confirmed ? "发票已上传并识别金额" : "发票已上传，请确认金额");
        await loadForEdit({ quiet: true });
      } else {
        setError(res.message || "上传失败");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "上传失败");
    } finally {
      setUploading("");
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    setSaving(true);
    setError("");
    try {
      const res = await deleteInvoice(invoiceId);
      if (res.success) {
        setToast("发票已删除");
        await loadForEdit({ quiet: true });
      } else {
        setError(res.message || "删除发票失败");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "删除发票失败");
    } finally {
      setSaving(false);
    }
  };

  const renderInvoiceList = (items, compact = false) =>
    items.length === 0 ? (
      <EmptyState compact title="暂无发票" description="上传 XML/PDF/OFD 或图片发票后，可查看并确认金额。" />
    ) : (
      <Stack spacing={1}>
        {items.map((invoice) => (
          <Stack
            key={invoice.id}
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ sm: "center" }}
            justifyContent="space-between"
            spacing={1}
            sx={{ px: 1.25, py: 1, border: `1px solid ${tokens.border}`, borderRadius: 2, bgcolor: "rgba(255,255,255,.66)" }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="body2" fontWeight={800}>
                  {formatAmount(invoice.amount)}
                </Typography>
                <StatusPill status={invoice.amount_confirmed ? "reimbursed" : "pending"} label={invoice.amount_confirmed ? "已确认" : "待确认"} />
                <StatusPill status="all" label={String(invoice.file_type || "").toUpperCase()} icon={false} />
              </Stack>
              {!compact && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {invoice.invoice_no || "无发票号码"}
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="查看发票">
                <IconButton aria-label="查看发票" size="small" onClick={() => setSelectedInvoice(invoice)}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="删除发票">
                <span>
                  <IconButton
                    aria-label="删除发票"
                    size="small"
                    color="error"
                    disabled={readonly || saving}
                    onClick={() => handleDeleteInvoice(invoice.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        ))}
      </Stack>
    );

  const renderTripInvoices = (trip, index) => {
    const tripInvoices = trip.id ? invoicesForTrip(trip.id) : [];
    const uploadKey = `trip-${index}`;
    return (
      <Stack spacing={1}>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle2" fontWeight={800}>
            车船费发票
          </Typography>
          <InvoiceUploader
            compact
            label="上传"
            disabled={readonly || !trip.id}
            uploading={uploading === uploadKey}
            onChange={(event) => handleUpload({ event, expenseCategory: "transport_fare", tripId: trip.id, key: uploadKey })}
          />
        </Stack>
        {renderInvoiceList(tripInvoices, true)}
      </Stack>
    );
  };

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <MotionPage>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} alignItems={{ md: "center" }}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h5">{isEdit ? "编辑报销单" : "新建报销单"}</Typography>
              {isEdit && <StatusPill status={status} />}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              按步骤维护基本信息、行程、费用与发票附件，右侧实时汇总金额
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button component={RouterLink} to="/reports" variant="outlined">
              返回工作台
            </Button>
            {isEdit &&
              actions.map((action) => (
                <Button
                  key={action.target}
                  variant="outlined"
                  color={action.color === "inherit" ? "inherit" : action.color}
                  onClick={() => handleStatusAction(action.target)}
                  disabled={saving}
                >
                  {action.label}
                </Button>
              ))}
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {readonly && <Alert severity="info">已报销状态为只读，不可修改。</Alert>}

        <Grid container spacing={2.5} alignItems="flex-start" sx={{ maxWidth: 1440, mx: "auto", width: "100%" }}>
          <Grid item xs={12} lg={8.2}>
            <Stack spacing={2.5}>
              <GlassCard>
                <Stack spacing={2}>
                  <SectionTitle title="基本信息" description="报销日期、部门、出差人和补贴标准会参与后续汇总计算" />
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6} xl={3}>
                      <TextField
                        fullWidth
                        label="报销日期"
                        type="date"
                        value={form.report_date}
                        onChange={handleChange("report_date")}
                        InputLabelProps={{ shrink: true }}
                        disabled={readonly}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} xl={3}>
                      <TextField fullWidth label="部门" value={form.department} onChange={handleChange("department")} disabled={readonly} />
                    </Grid>
                    <Grid item xs={12} sm={6} xl={3}>
                      <TextField fullWidth label="出差人" value={form.employee_name} onChange={handleChange("employee_name")} disabled={readonly} />
                    </Grid>
                    <Grid item xs={12} sm={6} xl={3}>
                      <TextField
                        fullWidth
                        label="途中补贴标准"
                        type="number"
                        value={form.daily_subsidy}
                        onChange={handleChange("daily_subsidy")}
                        disabled={readonly}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                          inputProps: { min: 0, step: "0.01" },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="出差事由"
                        value={form.purpose}
                        onChange={handleChange("purpose")}
                        disabled={readonly}
                        multiline
                        minRows={2}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </GlassCard>

              <TripTimeline
                trips={trips}
                readonly={readonly}
                dragIndex={dragIndex}
                setDragIndex={setDragIndex}
                addTrip={addTrip}
                removeTrip={removeTrip}
                moveTrip={moveTrip}
                updateTrip={updateTrip}
                renderTripInvoices={renderTripInvoices}
              />

              <GlassCard>
                <Stack spacing={2}>
                  <SectionTitle title="费用明细" description="费用金额来自已确认发票；图片发票上传后需要手动确认金额" />
                  <TableContainer sx={{ overflowX: "auto" }}>
                    <Table sx={{ minWidth: 880 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>费用类型</TableCell>
                          <TableCell align="right">金额</TableCell>
                          <TableCell align="center">发票</TableCell>
                          <TableCell>备注</TableCell>
                          <TableCell align="right">操作</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {EXPENSE_CATEGORIES.map((category) => {
                          const item = expenseItems.find((expenseItem) => expenseItem.category === category.value) || {
                            category: category.value,
                            remark: "",
                            amount: "0.00",
                            invoice_count: 0,
                          };
                          const uploadKey = `expense-${category.value}`;
                          return (
                            <TableRow key={category.value} hover>
                              <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <ReceiptLongIcon fontSize="small" sx={{ color: tokens.primary }} />
                                  <Typography fontWeight={800}>{category.label}</Typography>
                                </Stack>
                              </TableCell>
                              <TableCell align="right">
                                <Typography fontWeight={900}>{formatAmount(item.amount)}</Typography>
                              </TableCell>
                              <TableCell align="center">{item.invoice_count || 0} 张</TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  placeholder="备注"
                                  value={item.remark || ""}
                                  disabled={readonly}
                                  onChange={(event) => updateExpenseItem(category.value, event.target.value)}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <InvoiceUploader
                                  compact
                                  label="上传"
                                  disabled={readonly || !isEdit}
                                  uploading={uploading === uploadKey}
                                  onChange={(event) => handleUpload({ event, expenseCategory: category.value, key: uploadKey })}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Stack>
              </GlassCard>

              <GlassCard>
                <Stack spacing={2}>
                  <SectionTitle title="发票附件" description="所有已上传发票集中展示，待确认发票可打开查看并手动确认金额" />
                  {invoices.length === 0 ? (
                    <EmptyState
                      title="还没有发票附件"
                      description="保存报销单后，可以在行程或费用明细中上传发票。"
                      actionLabel={isEdit ? undefined : "先保存草稿"}
                      onAction={isEdit ? undefined : handleSave}
                    />
                  ) : (
                    renderInvoiceList(invoices)
                  )}
                </Stack>
              </GlassCard>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={3.8}>
            <ExpenseSummaryDock
              form={form}
              summary={summary}
              readonly={readonly}
              saving={saving}
              saveLabel={isEdit ? "保存修改" : "保存草稿"}
              saveState={saveState}
              onChange={handleChange}
              onSave={handleSave}
              canPrint={isEdit}
              onPrint={() => isEdit && navigate(`/reports/${id}/print`)}
            />
          </Grid>
        </Grid>

        <InvoiceViewer
          invoice={selectedInvoice}
          open={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          onUpdated={() => loadForEdit({ quiet: true })}
        />

        <Snackbar
          open={Boolean(toast)}
          autoHideDuration={2500}
          onClose={() => setToast("")}
          message={toast}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      </Stack>
    </MotionPage>
  );
}
