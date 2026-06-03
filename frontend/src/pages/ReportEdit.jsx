import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Grid, Snackbar, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import InvoiceUploader from "../components/InvoiceUploader";
import InvoiceViewer from "../components/InvoiceViewer";
import BasicInfoSection from "../components/reimbursements/BasicInfoSection";
import ExpenseItemsTable from "../components/reimbursements/ExpenseItemsTable";
import ExpenseSummaryDock from "../components/reimbursements/ExpenseSummaryDock";
import InvoiceAttachmentPanel from "../components/reimbursements/InvoiceAttachmentPanel";
import RemarksConfirmSection from "../components/reimbursements/RemarksConfirmSection";
import SaveStatusIndicator from "../components/reimbursements/SaveStatusIndicator";
import TripTimeline from "../components/reimbursements/TripTimeline";
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
import { formatAmount } from "../utils/formatters";
import {
  EXPENSE_CATEGORIES,
  SAVE_STATES,
  TRANSPORT_CATEGORY,
  activeInvoices,
  buildConfirmChecklist,
  calculateFormSummary,
  createEmptyForm,
  invoicesForTrip,
  makeBlankTrip,
  normalizeExpenseItem,
  normalizeFormForSubmit,
  normalizeLoadedForm,
  normalizeTrip,
  safeCurrency,
  summarizeInvoices,
} from "../utils/reimbursementForm";

const STATUS_ACTIONS = {
  draft: [{ target: "printed", label: "标记为已打印", color: "primary" }],
  printed: [
    { target: "reimbursed", label: "标记为已报销", color: "success" },
    { target: "draft", label: "退回草稿", color: "inherit" },
  ],
  reimbursed: [],
};

const ensureExpenseItems = (items = []) => {
  const normalized = items.map(normalizeExpenseItem);
  const existing = new Set(normalized.map((item) => item.category));
  EXPENSE_CATEGORIES.forEach((category) => {
    if (!existing.has(category.value)) normalized.push(normalizeExpenseItem({ category: category.value }));
  });
  return normalized;
};

export default function ReportEdit() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(createEmptyForm);
  const [status, setStatus] = useState("draft");
  const [trips, setTrips] = useState([]);
  const [expenseItems, setExpenseItems] = useState(() => ensureExpenseItems());
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [saveState, setSaveState] = useState(SAVE_STATES.idle);

  const readonly = status === "reimbursed";
  const statusActions = STATUS_ACTIONS[status] || [];

  const loadForEdit = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) setLoading(true);
      setError("");
      try {
        const res = await getReport(id);
        if (res.success) {
          const report = res.data;
          setForm(normalizeLoadedForm(report));
          setStatus(report.status);
          setTrips([...(report.trips || [])].sort((a, b) => a.sort_order - b.sort_order).map(normalizeTrip));
          setExpenseItems(ensureExpenseItems(report.expense_items || []));
          setInvoices(report.invoices || []);
          setSaveState(SAVE_STATES.saved);
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
    setSettingsLoaded(false);
    try {
      const res = await getSettings();
      if (res.success && res.data) {
        setForm((prev) => ({
          ...prev,
          department: res.data.department || "",
          employee_name: res.data.employee_name || "",
          daily_subsidy: safeCurrency(res.data.daily_subsidy),
        }));
        setSettingsLoaded(true);
      }
    } catch {
      setSettingsLoaded(false);
    }
  }, []);

  useEffect(() => {
    if (isEdit) {
      loadForEdit();
    } else {
      setForm(createEmptyForm());
      setStatus("draft");
      setTrips([]);
      setExpenseItems(ensureExpenseItems());
      setInvoices([]);
      setSaveState(SAVE_STATES.idle);
      loadDefaults();
      setLoading(false);
    }
  }, [isEdit, loadForEdit, loadDefaults]);

  const summary = useMemo(() => calculateFormSummary({ form, trips, invoices }), [form, trips, invoices]);

  const pendingInvoiceCount = useMemo(
    () => activeInvoices(invoices).filter((invoice) => !invoice.amount_confirmed).length,
    [invoices],
  );

  const checklist = useMemo(
    () => buildConfirmChecklist({ form, trips, invoices, summary }),
    [form, invoices, summary, trips],
  );

  const markDirty = () => {
    if (!saving) setSaveState(SAVE_STATES.dirty);
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    markDirty();
  };

  const handleMoneyBlur = (field) => () => {
    setForm((prev) => ({ ...prev, [field]: safeCurrency(prev[field]) }));
  };

  const updateTrip = (index, field, value) => {
    setTrips((prev) => prev.map((trip, itemIndex) => (itemIndex === index ? { ...trip, [field]: value } : trip)));
    markDirty();
  };

  const addTrip = () => {
    setTrips((prev) => [...prev, normalizeTrip(makeBlankTrip(form.report_date), prev.length)]);
    markDirty();
  };

  const removeTrip = (index) => {
    setTrips((prev) => prev.filter((_trip, itemIndex) => itemIndex !== index).map(normalizeTrip));
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

  const saveReport = async ({ printAfterSave = false } = {}) => {
    setSaving(true);
    setError("");
    setSaveState(SAVE_STATES.saving);
    try {
      const payload = normalizeFormForSubmit({ form, trips, expenseItems });
      if (isEdit) {
        const res = await updateReport(id, payload);
        if (!res.success) {
          setSaveState(SAVE_STATES.failed);
          setError(res.message || "保存失败");
          return null;
        }
        setToast("已保存");
        setSaveState(SAVE_STATES.saved);
        await loadForEdit({ quiet: true });
        if (printAfterSave) navigate(`/reports/${id}/print`);
        return id;
      }

      const res = await createReport(payload);
      if (!res.success) {
        setSaveState(SAVE_STATES.failed);
        setError(res.message || "创建失败");
        return null;
      }
      setToast("草稿已创建");
      setSaveState(SAVE_STATES.saved);
      const nextId = res.data.id;
      navigate(printAfterSave ? `/reports/${nextId}/print` : `/reports/${nextId}/edit`, { replace: true });
      return nextId;
    } catch (err) {
      setSaveState(SAVE_STATES.failed);
      setError(err.response?.data?.message || err.message || "保存失败");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleStatusAction = async (target) => {
    if (!isEdit) return;
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

  const handleUpload = async ({ event, expenseCategory, tripId = null, key }) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!isEdit) {
      setToast("请先保存草稿后再上传发票");
      return;
    }
    setUploading(key);
    setError("");
    try {
      const res = await uploadInvoice({ reportId: id, tripId, expenseCategory, file });
      if (res.success) {
        setToast(res.data.amount_confirmed ? "发票已上传，金额已确认" : "发票已上传，请核对金额");
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

  const renderTripInvoices = (trip, index) => {
    const tripInvoices = trip.id ? invoicesForTrip(invoices, trip.id) : [];
    const invoiceSummary = summarizeInvoices(tripInvoices);
    const uploadKey = `trip-${index}`;
    return (
      <Stack
        spacing={1}
        sx={{
          p: 1.25,
          borderRadius: 2,
          bgcolor: "rgba(248,250,252,.72)",
          border: "1px solid rgba(148,163,184,.18)",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="subtitle2" fontWeight={900}>
              车船费发票
            </Typography>
            <Typography variant="caption" color="text.secondary">
              已上传 {invoiceSummary.invoiceCount} 张，已确认 {invoiceSummary.confirmedCount} 张，金额 {formatAmount(invoiceSummary.amount)}
            </Typography>
          </Box>
          <InvoiceUploader
            compact
            label="上传"
            disabled={readonly || !trip.id}
            uploading={uploading === uploadKey}
            onChange={(event) => handleUpload({ event, expenseCategory: TRANSPORT_CATEGORY.value, tripId: trip.id, key: uploadKey })}
          />
        </Stack>
        {tripInvoices.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {tripInvoices.map((invoice) => (
              <Button key={invoice.id} size="small" variant="outlined" onClick={() => setSelectedInvoice(invoice)}>
                {invoice.amount_confirmed ? "已确认" : "待确认"} · {formatAmount(invoice.amount)}
              </Button>
            ))}
          </Stack>
        )}
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
      <Box sx={{ maxWidth: 1520, mx: "auto", width: "100%" }}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={2} alignItems={{ lg: "center" }}>
            <Box>
              <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="h5">{isEdit ? "编辑报销单" : "新建报销单"}</Typography>
                {isEdit && <StatusPill status={status} />}
                <SaveStatusIndicator state={saveState} compact />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                {isEdit
                  ? "更新报销信息、费用明细和附件状态，保持报销金额准确。"
                  : "填写出差信息、行程明细和费用附件，实时生成报销汇总。"}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button component={RouterLink} to="/reports" variant="outlined" startIcon={<ArrowBackIcon />}>
                返回列表
              </Button>
              <Button variant="outlined" startIcon={<SaveIcon />} disabled={saving || readonly} onClick={() => saveReport()}>
                {saving ? "保存中..." : isEdit ? "保存" : "保存草稿"}
              </Button>
              <Button variant="contained" startIcon={<SendIcon />} disabled={saving || readonly} onClick={() => saveReport({ printAfterSave: true })}>
                {isEdit ? "保存并打印" : "保存并打印预览"}
              </Button>
              <Button variant="outlined" startIcon={<PrintIcon />} disabled={!isEdit} onClick={() => navigate(`/reports/${id}/print`)}>
                打印预览
              </Button>
              {isEdit &&
                statusActions.map((action) => (
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
          {readonly && <Alert severity="info">已报销状态为只读，不能继续修改。</Alert>}

          <Grid container spacing={2.5} alignItems="flex-start">
            <Grid item xs={12} lg={8.4}>
              <Stack spacing={2.5}>
                <BasicInfoSection
                  form={form}
                  readonly={readonly}
                  settingsLoaded={settingsLoaded}
                  onChange={handleChange}
                  onMoneyBlur={handleMoneyBlur}
                />

                <TripTimeline
                  trips={trips}
                  readonly={readonly}
                  reportDate={form.report_date}
                  dailySubsidy={form.daily_subsidy}
                  addTrip={addTrip}
                  removeTrip={removeTrip}
                  moveTrip={moveTrip}
                  updateTrip={updateTrip}
                  renderTripInvoices={renderTripInvoices}
                />

                <ExpenseItemsTable
                  expenseItems={expenseItems}
                  invoices={invoices}
                  readonly={readonly}
                  isEdit={isEdit}
                  uploading={uploading}
                  pendingInvoiceCount={pendingInvoiceCount}
                  onRemarkChange={updateExpenseItem}
                  onUpload={handleUpload}
                  onOpenInvoice={setSelectedInvoice}
                />

                <InvoiceAttachmentPanel
                  invoices={invoices}
                  isEdit={isEdit}
                  readonly={readonly}
                  saving={saving}
                  onOpenInvoice={setSelectedInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                  onSaveDraft={() => saveReport()}
                />

                <RemarksConfirmSection
                  checklist={checklist}
                  saveState={saveState}
                />
              </Stack>
            </Grid>

            <Grid item xs={12} lg={3.6}>
              <ExpenseSummaryDock
                summary={summary}
                saveState={saveState}
                saving={saving}
                readonly={readonly}
                isEdit={isEdit}
                onBack={() => navigate("/reports")}
                onSave={() => saveReport()}
                onSaveAndPrint={() => saveReport({ printAfterSave: true })}
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
      </Box>
    </MotionPage>
  );
}
