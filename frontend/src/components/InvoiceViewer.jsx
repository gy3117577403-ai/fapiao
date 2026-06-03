import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getInvoiceFileUrl, updateInvoice } from "../api/client";
import { formatAmount } from "../utils/formatters";
import { getInvoiceDisplayStatus, safeCurrency } from "../utils/reimbursementForm";
import StatusPill from "./ui/StatusPill";

export default function InvoiceViewer({ invoice, open, onClose, onUpdated }) {
  const [amount, setAmount] = useState(invoice ? safeCurrency(invoice.amount) : "0.00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (invoice) {
      setAmount(safeCurrency(invoice.amount));
      setError("");
    }
  }, [invoice]);

  if (!invoice) return null;

  const status = getInvoiceDisplayStatus(invoice);

  const handleConfirm = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await updateInvoice(invoice.id, { amount: safeCurrency(amount), amount_confirmed: true });
      if (!res.success) {
        setError(res.message || "金额确认失败");
        return;
      }
      onUpdated?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "金额确认失败");
    } finally {
      setSaving(false);
    }
  };

  const fileUrl = getInvoiceFileUrl(invoice.id);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>发票查看与金额确认</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Stack spacing={1.5}>
              <Typography color="text.secondary">发票号码：{invoice.invoice_no || "—"}</Typography>
              <Typography color="text.secondary">发票日期：{invoice.invoice_date || "—"}</Typography>
              <Typography color="text.secondary">当前金额：{formatAmount(invoice.amount)}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography color="text.secondary">确认状态：</Typography>
                <StatusPill status={status.status} label={status.label} />
              </Stack>
              <TextField
                label="金额"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                onBlur={() => setAmount(safeCurrency(amount))}
                inputProps={{ min: 0, step: "0.01" }}
                helperText="图片/PDF/OFD 发票需要手动确认金额；XML 如已解析金额，也可以再次核对。"
              />
            </Stack>
          </Grid>
          <Grid item xs={12} md={7}>
            {invoice.file_type === "pdf" ? (
              <iframe title="invoice-pdf" src={fileUrl} style={{ width: "100%", height: 420, border: 0 }} />
            ) : invoice.file_type === "image" ? (
              <img src={fileUrl} alt="invoice" style={{ maxWidth: "100%", maxHeight: 420 }} />
            ) : (
              <Button href={fileUrl} target="_blank" rel="noreferrer" variant="outlined">
                打开原始文件
              </Button>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>关闭</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={saving}>
          {saving ? "确认中..." : "确认金额"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
