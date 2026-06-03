export const EXPENSE_CATEGORIES = [
  { value: "luggage", label: "行李费" },
  { value: "city_transport", label: "市内交通费" },
  { value: "accommodation", label: "住宿费" },
  { value: "postal", label: "邮电费" },
  { value: "no_sleeper_subsidy", label: "未乘卧铺补助" },
  { value: "toll", label: "过路费" },
  { value: "fuel_subsidy", label: "燃油补助" },
];

export const TRANSPORT_CATEGORY = { value: "transport_fare", label: "车船费" };

export const SAVE_STATES = {
  idle: "idle",
  dirty: "dirty",
  saving: "saving",
  saved: "saved",
  failed: "failed",
};

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const createEmptyForm = () => ({
  report_date: todayStr(),
  department: "",
  employee_name: "",
  purpose: "",
  daily_subsidy: "0.00",
  advance_date_month: "",
  advance_date_day: "",
  advance_amount: "0.00",
});

export const toNumber = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const safeCurrency = (value) => Math.max(0, toNumber(value)).toFixed(2);

export const normalizeTrip = (trip = {}, index = 0) => ({
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

export const makeBlankTrip = (reportDate) => {
  const date = reportDate ? new Date(`${reportDate}T00:00:00`) : new Date();
  const month = Number.isNaN(date.getTime()) ? 1 : date.getMonth() + 1;
  const day = Number.isNaN(date.getTime()) ? 1 : date.getDate();
  return normalizeTrip({ depart_month: month, depart_day: day, arrive_month: month, arrive_day: day }, 0);
};

export const normalizeExpenseItem = (item = {}) => ({
  id: item.id ?? null,
  category: item.category,
  remark: item.remark ?? "",
  amount: item.amount ?? "0.00",
  invoice_count: item.invoice_count ?? 0,
});

export const normalizeLoadedForm = (report = {}) => ({
  report_date: report.report_date || todayStr(),
  department: report.department || "",
  employee_name: report.employee_name || "",
  purpose: report.purpose || "",
  daily_subsidy: safeCurrency(report.daily_subsidy),
  advance_date_month: report.advance_date_month || "",
  advance_date_day: report.advance_date_day || "",
  advance_amount: safeCurrency(report.advance_amount),
});

const makeDate = (year, month, day) => {
  const parsed = new Date(year, month - 1, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;
  return parsed;
};

export const calculateTripSegmentDays = (trip, reportDate) => {
  const year = reportDate ? new Date(`${reportDate}T00:00:00`).getFullYear() : new Date().getFullYear();
  const departMonth = Number(trip?.depart_month);
  const departDay = Number(trip?.depart_day);
  const arriveMonth = Number(trip?.arrive_month);
  const arriveDay = Number(trip?.arrive_day);
  const arriveYear =
    arriveMonth < departMonth || (arriveMonth === departMonth && arriveDay < departDay) ? year + 1 : year;
  const depart = makeDate(year, departMonth, departDay);
  const arrive = makeDate(arriveYear, arriveMonth, arriveDay);
  if (!depart || !arrive) return 0;
  return Math.max(0, Math.floor((arrive.getTime() - depart.getTime()) / 86400000) + 1);
};

export const calculateTripDays = (trips = [], reportDate = "") => {
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

export const calculateTripSubsidy = (trips = [], subsidyStandard = 0, reportDate = "") =>
  calculateTripDays(trips, reportDate) * Math.max(0, toNumber(subsidyStandard));

export const activeInvoices = (invoices = []) => invoices.filter((invoice) => !invoice.deleted_at);

export const confirmedInvoices = (invoices = []) => activeInvoices(invoices).filter((invoice) => invoice.amount_confirmed);

export const calculateExpenseAmount = (expenses = []) =>
  expenses.reduce((sum, item) => sum + Math.max(0, toNumber(item?.amount)), 0);

export const calculateInvoiceAmount = (invoices = [], predicate = () => true) =>
  confirmedInvoices(invoices)
    .filter(predicate)
    .reduce((sum, invoice) => sum + Math.max(0, toNumber(invoice.amount)), 0);

export const calculateTotalAmount = ({ form, trips, invoices }) =>
  calculateTripSubsidy(trips, form?.daily_subsidy, form?.report_date) + calculateInvoiceAmount(invoices);

export const calculateShortfall = ({ form, trips, invoices }) =>
  Math.max(0, calculateTotalAmount({ form, trips, invoices }) - toNumber(form?.advance_amount));

export const calculateSurplus = ({ form, trips, invoices }) =>
  Math.max(0, toNumber(form?.advance_amount) - calculateTotalAmount({ form, trips, invoices }));

export const calculateFormSummary = ({ form, trips, invoices }) => {
  const subsidyDays = calculateTripDays(trips, form.report_date);
  const subsidyTotal = subsidyDays * Math.max(0, toNumber(form.daily_subsidy));
  const invoiceTotal = calculateInvoiceAmount(invoices);
  const otherFeeTotal = calculateInvoiceAmount(invoices, (invoice) => invoice.expense_category !== TRANSPORT_CATEGORY.value);
  const transportTotal = calculateInvoiceAmount(invoices, (invoice) => invoice.expense_category === TRANSPORT_CATEGORY.value);
  const total = subsidyTotal + invoiceTotal;
  const advance = Math.max(0, toNumber(form.advance_amount));
  return {
    advance,
    subsidyDays,
    subsidyTotal,
    invoiceTotal,
    otherFeeTotal,
    transportTotal,
    total,
    shortfall: Math.max(0, total - advance),
    surplus: Math.max(0, advance - total),
  };
};

export const summarizeInvoices = (items = []) => {
  const active = activeInvoices(items);
  const confirmed = active.filter((invoice) => invoice.amount_confirmed);
  return {
    amount: confirmed.reduce((sum, invoice) => sum + Math.max(0, toNumber(invoice.amount)), 0),
    confirmedCount: confirmed.length,
    invoiceCount: active.length,
    pendingCount: active.length - confirmed.length,
  };
};

export const invoicesForTrip = (invoices = [], tripId) =>
  activeInvoices(invoices).filter((invoice) => invoice.trip_id === tripId);

export const invoicesForCategory = (invoices = [], category) =>
  activeInvoices(invoices).filter((invoice) => invoice.expense_category === category && !invoice.trip_id);

export const getExpenseCategoryLabel = (category) =>
  [TRANSPORT_CATEGORY, ...EXPENSE_CATEGORIES].find((item) => item.value === category)?.label || category || "未分类";

export const getInvoiceDisplayStatus = (invoice) => {
  if (!invoice) return { status: "unuploaded", label: "未上传" };
  if (invoice.amount_confirmed) return { status: "confirmed", label: "已确认" };
  return { status: "pending", label: "待确认" };
};

export const normalizeFormForSubmit = ({ form, trips, expenseItems }) => ({
  report_date: form.report_date || null,
  department: form.department.trim() || null,
  employee_name: form.employee_name.trim() || null,
  purpose: form.purpose.trim() || null,
  daily_subsidy: form.daily_subsidy === "" ? "0.00" : safeCurrency(form.daily_subsidy),
  advance_date_month: form.advance_date_month === "" ? null : Number(form.advance_date_month),
  advance_date_day: form.advance_date_day === "" ? null : Number(form.advance_date_day),
  advance_amount: form.advance_amount === "" ? "0.00" : safeCurrency(form.advance_amount),
  trips: trips.map((trip, index) => ({
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
  })),
  expense_items: expenseItems.map((item) => ({
    id: item.id || null,
    category: item.category,
    remark: item.remark?.trim() || null,
  })),
});

export const buildConfirmChecklist = ({ form, trips, invoices, summary }) => [
  {
    label: "基本信息已填写",
    done: Boolean(form.report_date && form.department && form.employee_name && form.purpose),
  },
  { label: "已添加行程", done: trips.length > 0 },
  { label: "已填写费用", done: summary.invoiceTotal > 0 || summary.subsidyTotal > 0 },
  { label: "发票金额已确认", done: activeInvoices(invoices).every((invoice) => invoice.amount_confirmed) },
  { label: "报销金额已计算", done: Number.isFinite(summary.total) },
];
