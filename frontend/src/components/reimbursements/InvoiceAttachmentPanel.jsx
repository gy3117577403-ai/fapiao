import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EmptyState from "../ui/EmptyState";
import GlassCard from "../ui/GlassCard";
import StatusPill from "../ui/StatusPill";
import { formatAmount, formatDate } from "../../utils/formatters";
import {
  activeInvoices,
  getExpenseCategoryLabel,
  getInvoiceDisplayStatus,
  safeCurrency,
  toNumber,
} from "../../utils/reimbursementForm";
import FormSectionHeader from "./FormSectionHeader";

const fileName = (invoice) => invoice.file_name || invoice.file_path?.split(/[\\/]/).pop() || `发票 ${invoice.id}`;

export default function InvoiceAttachmentPanel({
  invoices,
  isEdit,
  readonly,
  saving,
  onOpenInvoice,
  onDeleteInvoice,
  onSaveDraft,
}) {
  const [deleteInvoice, setDeleteInvoice] = useState(null);
  const active = activeInvoices(invoices);

  const handleDelete = async () => {
    if (!deleteInvoice) return;
    await onDeleteInvoice(deleteInvoice.id);
    setDeleteInvoice(null);
  };

  return (
    <GlassCard>
      <Stack spacing={2}>
        <FormSectionHeader
          index={4}
          title="发票附件"
          description="集中查看附件状态。当前项目不会伪造 OCR 结果，未确认金额的发票会保持待确认。"
        />

        {!isEdit && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            先保存草稿后，才能把发票上传到具体报销单。
          </Alert>
        )}

        {active.length === 0 ? (
          <EmptyState
            title="还没有上传发票"
            description="上传发票后，可以在这里核对金额和附件状态。"
            actionText={isEdit ? undefined : "先保存草稿"}
            onAction={isEdit ? undefined : onSaveDraft}
            compact
          />
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 840 }}>
              <TableHead>
                <TableRow>
                  <TableCell>文件名</TableCell>
                  <TableCell>费用类型</TableCell>
                  <TableCell align="right">金额</TableCell>
                  <TableCell align="center">状态</TableCell>
                  <TableCell>上传时间</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {active.map((invoice) => {
                  const status = getInvoiceDisplayStatus(invoice);
                  const amount = toNumber(invoice.amount);
                  return (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Typography fontWeight={800} noWrap sx={{ maxWidth: 220 }}>
                          {fileName(invoice)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {String(invoice.file_type || "").toUpperCase() || "FILE"}
                        </Typography>
                      </TableCell>
                      <TableCell>{getExpenseCategoryLabel(invoice.expense_category)}</TableCell>
                      <TableCell align="right">
                        {invoice.amount_confirmed || amount > 0 ? formatAmount(safeCurrency(amount)) : "待确认"}
                      </TableCell>
                      <TableCell align="center">
                        <StatusPill status={status.status} label={status.label} />
                      </TableCell>
                      <TableCell>{formatDate(invoice.created_at, "—")}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                          <Button size="small" startIcon={<VisibilityIcon />} onClick={() => onOpenInvoice(invoice)}>
                            查看
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            disabled={readonly || saving}
                            onClick={() => setDeleteInvoice(invoice)}
                          >
                            删除
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Dialog open={Boolean(deleteInvoice)} onClose={() => setDeleteInvoice(null)}>
        <DialogTitle>确认删除发票</DialogTitle>
        <DialogContent>
          <DialogContentText>删除后该发票金额不会计入汇总。确定要删除「{deleteInvoice ? fileName(deleteInvoice) : ""}」吗？</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteInvoice(null)}>取消</Button>
          <Button color="error" onClick={handleDelete} disabled={saving}>
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
    </GlassCard>
  );
}
