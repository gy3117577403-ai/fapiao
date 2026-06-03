import { isCurrentMonth, isCurrentYear, toNumber } from "./formatters";

export const STATUS_ITEMS = [
  { key: "draft", name: "草稿", summaryKey: "draft_count" },
  { key: "printed", name: "已打印", summaryKey: "printed_count" },
  { key: "reimbursed", name: "已报销", summaryKey: "reimbursed_count" },
  { key: "pending", name: "待确认发票", summaryKey: "pending_invoice_count" },
];

export const supportsPendingInvoiceFilter = (reports = []) =>
  reports.some((report) => Array.isArray(report.invoices));

export const hasPendingInvoice = (report) =>
  (report?.invoices || []).some((invoice) => !invoice.deleted_at && !invoice.amount_confirmed);

export const buildStatusData = (summary) =>
  STATUS_ITEMS.map((item) => ({
    ...item,
    value: toNumber(summary?.[item.summaryKey]),
  }));

export const buildMonthlyTrendData = (reports = [], now = new Date()) => {
  const grouped = new Map();
  reports.forEach((report) => {
    if (!isCurrentMonth(report.report_date, now)) return;
    const date = report.report_date;
    const current = grouped.get(date) || { date, amount: 0, count: 0 };
    current.amount += toNumber(report.total_amount);
    current.count += 1;
    grouped.set(date, current);
  });

  return [...grouped.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
};

export const filterRecentReports = (reports = [], filter = "all") => {
  if (!filter || filter === "all") return reports;
  if (filter === "pending") {
    return supportsPendingInvoiceFilter(reports) ? reports.filter(hasPendingInvoice) : reports;
  }
  if (filter === "month") return reports.filter((report) => isCurrentMonth(report.report_date));
  if (filter === "year") return reports.filter((report) => isCurrentYear(report.report_date));
  return reports.filter((report) => report.status === filter);
};

export const getFilterLabel = (filter, statusData = []) => {
  if (!filter || filter === "all") return "全部";
  if (filter === "month") return "本月报销单";
  if (filter === "year") return "今年报销单";
  return statusData.find((item) => item.key === filter)?.name || "全部";
};
