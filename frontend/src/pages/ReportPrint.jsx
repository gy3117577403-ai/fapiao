import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  GlobalStyles,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Link as RouterLink, useParams } from "react-router-dom";
import { getReport, getReportPdfUrl, isStaticMode } from "../api/client";
import StatusPill from "../components/ui/StatusPill";
import { formatAmount, formatDate, toNumber } from "../utils/formatters";
import { EXPENSE_CATEGORIES } from "../utils/reimbursementForm";

const plainAmount = (value) => toNumber(value).toFixed(2);

function PrintableReport({ report }) {
  const trips = [...(report.trips || [])].sort((a, b) => a.sort_order - b.sort_order).slice(0, 7);
  const expenseMap = new Map((report.expense_items || []).map((item) => [item.category, item]));
  const transportTotal = trips.reduce((sum, trip) => sum + toNumber(trip.amount), 0);
  const transportCount = trips.reduce((sum, trip) => sum + toNumber(trip.invoice_count), 0);
  const otherTotal = EXPENSE_CATEGORIES.reduce((sum, item) => sum + toNumber(expenseMap.get(item.value)?.amount), 0);
  const otherCount = EXPENSE_CATEGORIES.reduce((sum, item) => sum + toNumber(expenseMap.get(item.value)?.invoice_count), 0);

  return (
    <Box className="print-sheet" sx={{ bgcolor: "white", color: "#111827", p: 3, border: "1px solid #D9E1EA" }}>
      <Typography align="center" fontWeight={800} sx={{ fontSize: 28, letterSpacing: 0, mb: 2 }}>
        出差旅费报销单
      </Typography>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }} flexWrap="wrap" gap={1}>
        <Typography>部门：{report.department || ""}</Typography>
        <Typography>出差人：{report.employee_name || ""}</Typography>
        <Typography>报销日期：{formatDate(report.report_date, "")}</Typography>
      </Stack>
      <Typography sx={{ mb: 1 }}>出差事由：{report.purpose || ""}</Typography>

      <Table size="small" className="print-table">
        <TableHead>
          <TableRow>
            <TableCell>出发</TableCell>
            <TableCell>到达</TableCell>
            <TableCell>交通工具</TableCell>
            <TableCell align="center">单据</TableCell>
            <TableCell align="right">车船费</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell>
                {trip.depart_month}/{trip.depart_day} {trip.depart_hour ?? ""}:00 {trip.depart_place || ""}
              </TableCell>
              <TableCell>
                {trip.arrive_month}/{trip.arrive_day} {trip.arrive_hour ?? ""}:00 {trip.arrive_place || ""}
              </TableCell>
              <TableCell>{trip.transport || ""}</TableCell>
              <TableCell align="center">{trip.invoice_count || ""}</TableCell>
              <TableCell align="right">{toNumber(trip.amount) ? plainAmount(trip.amount) : ""}</TableCell>
            </TableRow>
          ))}
          {Array.from({ length: Math.max(0, 7 - trips.length) }).map((_, index) => (
            <TableRow key={`blank-${index}`}>
              <TableCell>&nbsp;</TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={3} align="center">
              合计
            </TableCell>
            <TableCell align="center">{transportCount || ""}</TableCell>
            <TableCell align="right">{transportTotal ? plainAmount(transportTotal) : ""}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table size="small" className="print-table" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>项目</TableCell>
            <TableCell align="center">单据</TableCell>
            <TableCell align="right">金额</TableCell>
            <TableCell>项目</TableCell>
            <TableCell align="center">单据</TableCell>
            <TableCell align="right">金额</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {EXPENSE_CATEGORIES.slice(0, 4).map((left, index) => {
            const right = EXPENSE_CATEGORIES[index + 4];
            const leftItem = expenseMap.get(left.value);
            const rightItem = right ? expenseMap.get(right.value) : null;
            return (
              <TableRow key={left.value}>
                <TableCell>{left.label}</TableCell>
                <TableCell align="center">{leftItem?.invoice_count || ""}</TableCell>
                <TableCell align="right">{toNumber(leftItem?.amount) ? plainAmount(leftItem.amount) : ""}</TableCell>
                <TableCell>{right?.label || ""}</TableCell>
                <TableCell align="center">{rightItem?.invoice_count || ""}</TableCell>
                <TableCell align="right">{toNumber(rightItem?.amount) ? plainAmount(rightItem.amount) : ""}</TableCell>
              </TableRow>
            );
          })}
          <TableRow>
            <TableCell colSpan={4} align="center">
              其他费用合计
            </TableCell>
            <TableCell align="center">{otherCount || ""}</TableCell>
            <TableCell align="right">{otherTotal ? plainAmount(otherTotal) : ""}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Divider sx={{ my: 2 }} />
      <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Typography>补贴天数：{report.subsidy_days || 0} 天</Typography>
        <Typography>途中补贴：{formatAmount(report.subsidy_total)}</Typography>
        <Typography>预借旅费：{formatAmount(report.advance_amount)}</Typography>
        <Typography fontWeight={800}>报销总额：{formatAmount(report.total_amount)}</Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
        <Typography>主管：</Typography>
        <Typography>审核：</Typography>
        <Typography>报销人：</Typography>
      </Stack>
    </Box>
  );
}

export default function ReportPrint() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(Date.now());

  const pdfUrl = useMemo(() => `${getReportPdfUrl(id)}?v=${version}`, [id, version]);

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReport(id);
      if (res.success) {
        setReport(res.data);
      } else {
        setError(res.message || "加载报销单失败");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "加载报销单失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  return (
    <Stack spacing={3}>
      <GlobalStyles
        styles={{
          "@media print": {
            "body *": { visibility: "hidden" },
            ".print-sheet, .print-sheet *": { visibility: "visible" },
            ".print-sheet": { position: "absolute", left: 0, top: 0, width: "100%", border: "0 !important" },
          },
          ".print-table td, .print-table th": { borderColor: "#111827" },
        }}
      />

      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={2}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Button component={RouterLink} to="/reports" startIcon={<ArrowBackIcon />} variant="outlined">
            返回列表
          </Button>
          <Typography variant="h5" fontWeight={700}>
            打印预览
          </Typography>
          {report && <StatusPill status={report.status} />}
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {isStaticMode ? (
            <Button startIcon={<PrintIcon />} variant="contained" onClick={() => window.print()}>
              打印/另存 PDF
            </Button>
          ) : (
            <>
              <Button startIcon={<RefreshIcon />} variant="outlined" onClick={() => setVersion(Date.now())}>
                刷新 PDF
              </Button>
              <Button href={pdfUrl} target="_blank" rel="noreferrer" startIcon={<OpenInNewIcon />} variant="outlined">
                打开
              </Button>
              <Button href={pdfUrl} download={`报销单_${id}.pdf`} startIcon={<DownloadIcon />} variant="contained">
                下载
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : !report ? (
            <Alert severity="warning">报销单不存在</Alert>
          ) : (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Typography color="text.secondary">报销日期：{formatDate(report.report_date, "—")}</Typography>
                <Typography color="text.secondary">出差人：{report.employee_name || "—"}</Typography>
                <Typography color="text.secondary">报销总额：{formatAmount(report.total_amount)}</Typography>
              </Stack>
              {isStaticMode ? (
                <PrintableReport report={report} />
              ) : (
                <Box
                  component="iframe"
                  title="report-pdf"
                  src={pdfUrl}
                  sx={{ width: "100%", height: "72vh", border: 1, borderColor: "divider", borderRadius: 1 }}
                />
              )}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
