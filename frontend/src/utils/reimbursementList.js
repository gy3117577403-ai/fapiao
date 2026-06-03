import { formatAmount, toNumber } from "./formatters";

export const REIMBURSEMENT_STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "draft", label: "草稿" },
  { value: "printed", label: "已打印" },
  { value: "reimbursed", label: "已报销" },
  { value: "pending", label: "待确认发票" },
];

export const defaultReimbursementFilters = {
  keyword: "",
  startDate: "",
  endDate: "",
  status: "all",
  minAmount: "",
  maxAmount: "",
};

export const getReimbursementStatus = (record) => record?.status || "draft";

export const getReimbursementAmount = (record) => Math.max(0, toNumber(record?.total_amount));

export const getInvoiceAmount = (record) =>
  Math.max(0, toNumber(record?.total_amount) - toNumber(record?.subsidy_total));

export const getInvoiceOverview = (record) => {
  const invoices = (record?.invoices || []).filter((invoice) => !invoice.deleted_at);
  const pendingCount = invoices.filter((invoice) => !invoice.amount_confirmed).length;
  return {
    invoiceCount: invoices.length,
    pendingCount,
    confirmedCount: invoices.length - pendingCount,
  };
};

export const isPendingInvoice = (record) => getInvoiceOverview(record).pendingCount > 0;

export const normalizeReimbursement = (record) => ({
  raw: record,
  id: record?.id,
  reportDate: record?.report_date || "",
  employeeName: record?.employee_name || "",
  department: record?.department || "",
  purpose: record?.purpose || "",
  subsidyDays: toNumber(record?.subsidy_days),
  subsidyTotal: toNumber(record?.subsidy_total),
  invoiceAmount: getInvoiceAmount(record),
  totalAmount: getReimbursementAmount(record),
  advanceAmount: toNumber(record?.advance_amount),
  shortfall: toNumber(record?.shortfall),
  surplus: toNumber(record?.surplus),
  status: getReimbursementStatus(record),
  invoiceOverview: getInvoiceOverview(record),
});

export const countByStatus = (records = []) => {
  const counts = { all: records.length, draft: 0, printed: 0, reimbursed: 0, pending: 0 };
  records.forEach((record) => {
    const status = getReimbursementStatus(record);
    counts[status] = (counts[status] || 0) + 1;
    if (isPendingInvoice(record)) counts.pending += 1;
  });
  return counts;
};

const includesKeyword = (record, keyword) => {
  if (!keyword) return true;
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return true;
  return [record?.purpose, record?.employee_name, record?.department].some((field) =>
    String(field || "").toLowerCase().includes(normalizedKeyword),
  );
};

export const filterReimbursements = (records = [], filters = defaultReimbursementFilters) =>
  records.filter((record) => {
    if (!includesKeyword(record, filters.keyword)) return false;
    if (filters.status === "pending" && !isPendingInvoice(record)) return false;
    if (filters.status && filters.status !== "all" && filters.status !== "pending" && getReimbursementStatus(record) !== filters.status) {
      return false;
    }
    if (filters.startDate && String(record?.report_date || "") < filters.startDate) return false;
    if (filters.endDate && String(record?.report_date || "") > filters.endDate) return false;
    if (filters.minAmount !== "" && getReimbursementAmount(record) < toNumber(filters.minAmount)) return false;
    if (filters.maxAmount !== "" && getReimbursementAmount(record) > toNumber(filters.maxAmount)) return false;
    return true;
  });

export const hasActiveReimbursementFilters = (filters = defaultReimbursementFilters) =>
  Boolean(
    filters.keyword?.trim() ||
      filters.startDate ||
      filters.endDate ||
      (filters.status && filters.status !== "all") ||
      filters.minAmount !== "" ||
      filters.maxAmount !== "",
  );

export const buildFilterChips = (filters = defaultReimbursementFilters) => {
  const chips = [];
  if (filters.keyword?.trim()) chips.push({ key: "keyword", label: `关键词：${filters.keyword.trim()}` });
  if (filters.startDate || filters.endDate) {
    chips.push({ key: "date", label: `日期：${filters.startDate || "不限"} 至 ${filters.endDate || "不限"}` });
  }
  if (filters.status && filters.status !== "all") {
    const statusLabel = REIMBURSEMENT_STATUS_OPTIONS.find((item) => item.value === filters.status)?.label || filters.status;
    chips.push({ key: "status", label: `状态：${statusLabel}` });
  }
  if (filters.minAmount !== "" || filters.maxAmount !== "") {
    chips.push({
      key: "amount",
      label: `金额：${filters.minAmount !== "" ? formatAmount(filters.minAmount) : "不限"} - ${
        filters.maxAmount !== "" ? formatAmount(filters.maxAmount) : "不限"
      }`,
    });
  }
  return chips;
};

export const clearReimbursementFilter = (filters, key) => {
  if (key === "keyword") return { ...filters, keyword: "" };
  if (key === "date") return { ...filters, startDate: "", endDate: "" };
  if (key === "status") return { ...filters, status: "all" };
  if (key === "amount") return { ...filters, minAmount: "", maxAmount: "" };
  return filters;
};
