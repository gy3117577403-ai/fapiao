import {
  Alert,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InvoiceUploader from "../InvoiceUploader";
import GlassCard from "../ui/GlassCard";
import StatusPill from "../ui/StatusPill";
import { formatAmount } from "../../utils/formatters";
import {
  EXPENSE_CATEGORIES,
  invoicesForCategory,
  summarizeInvoices,
} from "../../utils/reimbursementForm";
import { tokens } from "../../theme";
import FormSectionHeader from "./FormSectionHeader";

export default function ExpenseItemsTable({
  expenseItems,
  invoices,
  readonly,
  isEdit,
  uploading,
  onRemarkChange,
  onUpload,
  onOpenInvoice,
  pendingInvoiceCount,
}) {
  return (
    <GlassCard>
      <Stack spacing={2}>
        <FormSectionHeader
          index={3}
          title="费用明细"
          description="金额来自已确认发票；图片发票上传后需要手动确认金额，确认后计入汇总。"
        />

        {pendingInvoiceCount > 0 && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            {pendingInvoiceCount} 张发票待确认金额，确认后才会计入报销总额。
          </Alert>
        )}

        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 900 }}>
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
                };
                const uploadKey = `expense-${category.value}`;
                const categoryInvoices = invoicesForCategory(invoices, category.value);
                const invoiceSummary = summarizeInvoices(categoryInvoices);
                return (
                  <TableRow
                    key={category.value}
                    hover
                    sx={{
                      transition: "background-color 180ms ease",
                      "&:hover": { bgcolor: "rgba(239,246,255,.62)" },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ReceiptLongIcon fontSize="small" sx={{ color: tokens.primary }} />
                        <Typography fontWeight={800}>{category.label}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={900} color={tokens.primaryDeep} sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatAmount(invoiceSummary.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack alignItems="center" spacing={0.6}>
                        <Typography>{invoiceSummary.invoiceCount} 张</Typography>
                        {invoiceSummary.pendingCount > 0 ? (
                          <StatusPill status="pending" label={`${invoiceSummary.pendingCount} 张待确认`} />
                        ) : invoiceSummary.confirmedCount > 0 ? (
                          <StatusPill status="confirmed" label={`${invoiceSummary.confirmedCount} 张已确认`} />
                        ) : (
                          <StatusPill status="unuploaded" label="未上传" icon={false} />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        placeholder="备注"
                        value={item.remark || ""}
                        disabled={readonly}
                        onChange={(event) => onRemarkChange(category.value, event.target.value)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center">
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          disabled={categoryInvoices.length === 0}
                          onClick={() => onOpenInvoice(categoryInvoices[0])}
                        >
                          查看
                        </Button>
                        <InvoiceUploader
                          compact
                          label="上传"
                          disabled={readonly || !isEdit}
                          uploading={uploading === uploadKey}
                          onChange={(event) => onUpload({ event, expenseCategory: category.value, key: uploadKey })}
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </GlassCard>
  );
}
