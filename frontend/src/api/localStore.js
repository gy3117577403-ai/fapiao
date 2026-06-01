const STORAGE_KEY = "fapiao_reimbursement_tool_v1";

const EXPENSE_CATEGORIES = [
  "transport_fare",
  "luggage",
  "city_transport",
  "accommodation",
  "postal",
  "no_sleeper_subsidy",
  "toll",
  "fuel_subsidy",
];

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp"]);

const nowIso = () => new Date().toISOString();

const response = (data, message = "") => Promise.resolve({ success: true, message, data });

const money = (value) => Number(value || 0).toFixed(2);

const makeInitialState = () => ({
  settings: {
    id: 1,
    department: "",
    employee_name: "",
    daily_subsidy: "80.00",
  },
  reports: [],
  nextReportId: 1,
  nextTripId: 1,
  nextExpenseItemId: 1,
  nextInvoiceId: 1,
});

const readState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeInitialState();
    return { ...makeInitialState(), ...JSON.parse(raw) };
  } catch {
    return makeInitialState();
  }
};

const writeState = (state) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const ensureExpenseItems = (state, report) => {
  report.expense_items = report.expense_items || [];
  const existing = new Set(report.expense_items.map((item) => item.category));
  EXPENSE_CATEGORIES.forEach((category) => {
    if (!existing.has(category)) {
      report.expense_items.push({
        id: state.nextExpenseItemId++,
        report_id: report.id,
        category,
        remark: "",
        created_at: nowIso(),
      });
    }
  });
};

const validDate = (year, month, day) => {
  const parsed = new Date(year, month - 1, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;
  return parsed;
};

const calculateSubsidyDays = (reportDate, trips) => {
  if (!trips?.length) return 0;
  const year = reportDate ? new Date(`${reportDate}T00:00:00`).getFullYear() : new Date().getFullYear();
  const ranges = trips
    .map((trip) => {
      const departMonth = Number(trip.depart_month);
      const departDay = Number(trip.depart_day);
      const arriveMonth = Number(trip.arrive_month);
      const arriveDay = Number(trip.arrive_day);
      const arriveYear =
        arriveMonth < departMonth || (arriveMonth === departMonth && arriveDay < departDay) ? year + 1 : year;
      const depart = validDate(year, departMonth, departDay);
      const arrive = validDate(arriveYear, arriveMonth, arriveDay);
      return depart && arrive ? { depart, arrive } : null;
    })
    .filter(Boolean);

  if (ranges.length === 0) return 0;
  const earliest = Math.min(...ranges.map((range) => range.depart.getTime()));
  const latest = Math.max(...ranges.map((range) => range.arrive.getTime()));
  return Math.max(0, Math.floor((latest - earliest) / 86400000) + 1);
};

const activeConfirmedInvoices = (report) =>
  (report.invoices || []).filter((invoice) => !invoice.deleted_at && invoice.amount_confirmed);

const recalculateReport = (report) => {
  const subsidyDays = calculateSubsidyDays(report.report_date, report.trips || []);
  const subsidyTotal = subsidyDays * Number(report.daily_subsidy || 0);
  const invoiceTotal = activeConfirmedInvoices(report).reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  const total = subsidyTotal + invoiceTotal;
  const advance = Number(report.advance_amount || 0);

  report.subsidy_days = subsidyDays;
  report.subsidy_total = money(subsidyTotal);
  report.total_amount = money(total);
  report.shortfall = money(Math.max(0, total - advance));
  report.surplus = money(Math.max(0, advance - total));
  report.daily_subsidy = money(report.daily_subsidy);
  report.advance_amount = money(report.advance_amount);
  report.updated_at = nowIso();
};

const enrichReport = (report) => {
  const cloned = structuredClone(report);
  const invoices = (cloned.invoices || []).filter((invoice) => !invoice.deleted_at);
  cloned.invoices = invoices;
  cloned.trips = (cloned.trips || []).map((trip) => {
    const tripInvoices = invoices.filter(
      (invoice) => invoice.amount_confirmed && invoice.expense_category === "transport_fare" && invoice.trip_id === trip.id,
    );
    return {
      ...trip,
      invoice_count: tripInvoices.length,
      amount: money(tripInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0)),
    };
  });
  cloned.expense_items = (cloned.expense_items || []).map((item) => {
    const itemInvoices = invoices.filter(
      (invoice) => invoice.amount_confirmed && invoice.expense_category === item.category,
    );
    return {
      ...item,
      invoice_count: itemInvoices.length,
      amount: money(itemInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0)),
    };
  });
  return cloned;
};

const findReport = (state, id) => state.reports.find((report) => report.id === Number(id) && !report.deleted_at);

const detectFileType = (filename = "") => {
  const dot = filename.lastIndexOf(".");
  const ext = dot >= 0 ? filename.slice(dot).toLowerCase() : "";
  if (ext === ".xml") return "xml";
  if (ext === ".pdf") return "pdf";
  if (ext === ".ofd") return "ofd";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  throw new Error("不支持的发票文件类型");
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const parseDecimal = (value) => {
  const normalized = String(value || "").replace(/[¥￥,]/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? money(parsed) : "0.00";
};

const parseInvoiceDate = (value) => {
  if (!value) return null;
  const text = String(value).trim().replace(/年|月|\./g, "-").replace(/日/g, "").replace(/\//g, "-");
  if (/^\d{8}$/.test(text)) {
    return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
  }
  const match = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
};

const firstXmlText = (doc, tags) => {
  for (const tag of tags) {
    const found = doc.getElementsByTagName(tag)[0];
    if (found?.textContent) return found.textContent.trim();
  }
  return null;
};

const parseXmlInvoice = async (file) => {
  const text = await file.text();
  const doc = new DOMParser().parseFromString(text, "text/xml");
  const invoiceNo = firstXmlText(doc, ["FPH", "InvoiceNo"]);
  const invoiceDate = parseInvoiceDate(firstXmlText(doc, ["KPRQ", "IssueDate"]));
  const amount = parseDecimal(firstXmlText(doc, ["JSHJ", "TotalAmount"]));
  return {
    invoice_no: invoiceNo,
    invoice_date: invoiceDate,
    amount,
    raw: { source: "xml" },
  };
};

export const localApi = {
  getHealth: () => response({ status: "ok", database: "browser" }),

  getStatsSummary: () => {
    const state = readState();
    const reports = state.reports.filter((report) => !report.deleted_at);
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const inYear = reports.filter((report) => report.report_date && new Date(`${report.report_date}T00:00:00`).getFullYear() === year);
    const inMonth = inYear.filter((report) => new Date(`${report.report_date}T00:00:00`).getMonth() === month);
    const sumAmount = (items) => money(items.reduce((sum, report) => sum + Number(report.total_amount || 0), 0));
    const pendingInvoiceCount = reports.reduce(
      (sum, report) => sum + (report.invoices || []).filter((invoice) => !invoice.deleted_at && !invoice.amount_confirmed).length,
      0,
    );
    const recent = [...reports].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))).slice(0, 5);

    return response({
      month_amount: sumAmount(inMonth),
      month_count: inMonth.length,
      year_amount: sumAmount(inYear),
      year_count: inYear.length,
      draft_count: reports.filter((report) => report.status === "draft").length,
      printed_count: reports.filter((report) => report.status === "printed").length,
      reimbursed_count: reports.filter((report) => report.status === "reimbursed").length,
      pending_invoice_count: pendingInvoiceCount,
      recent_reports: recent.map(enrichReport),
    });
  },

  getSettings: () => response(readState().settings),

  updateSettings: (payload) => {
    const state = readState();
    state.settings = { ...state.settings, ...payload, daily_subsidy: money(payload.daily_subsidy) };
    writeState(state);
    return response(state.settings);
  },

  getReports: ({ page = 1, pageSize = 20, status } = {}) => {
    const state = readState();
    let items = state.reports.filter((report) => !report.deleted_at);
    if (status && status !== "all") {
      items = items.filter((report) => report.status === status);
    }
    items = items.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    const total = items.length;
    const start = (page - 1) * pageSize;
    return response({ items: items.slice(start, start + pageSize).map(enrichReport), total, page, page_size: pageSize });
  },

  getReport: (id) => {
    const report = findReport(readState(), id);
    if (!report) return Promise.resolve({ success: false, message: "报销单不存在", data: null });
    return response(enrichReport(report));
  },

  createReport: (payload) => {
    const state = readState();
    const reportId = state.nextReportId++;
    const report = {
      ...payload,
      id: reportId,
      status: "draft",
      department: payload.department || state.settings.department || "",
      employee_name: payload.employee_name || state.settings.employee_name || "",
      daily_subsidy: money(payload.daily_subsidy || state.settings.daily_subsidy),
      advance_amount: money(payload.advance_amount),
      created_at: nowIso(),
      updated_at: nowIso(),
      deleted_at: null,
      invoices: [],
      trips: (payload.trips || []).map((trip, index) => ({
        ...trip,
        id: state.nextTripId++,
        report_id: reportId,
        sort_order: index + 1,
      })),
      expense_items: [],
    };
    ensureExpenseItems(state, report);
    recalculateReport(report);
    state.reports.push(report);
    writeState(state);
    return response(enrichReport(report), "报销单已创建");
  },

  updateReport: (id, payload) => {
    const state = readState();
    const report = findReport(state, id);
    if (!report) return Promise.resolve({ success: false, message: "报销单不存在", data: null });
    if (report.status === "reimbursed") return Promise.resolve({ success: false, message: "已报销状态不可修改", data: null });

    Object.assign(report, {
      ...payload,
      daily_subsidy: money(payload.daily_subsidy),
      advance_amount: money(payload.advance_amount),
    });
    report.trips = (payload.trips || []).map((trip, index) => ({
      ...trip,
      id: trip.id || state.nextTripId++,
      report_id: report.id,
      sort_order: index + 1,
    }));
    ensureExpenseItems(state, report);
    const remarks = new Map((payload.expense_items || []).map((item) => [item.category, item.remark || ""]));
    report.expense_items.forEach((item) => {
      if (remarks.has(item.category)) item.remark = remarks.get(item.category);
    });
    recalculateReport(report);
    writeState(state);
    return response(enrichReport(report), "报销单已更新");
  },

  deleteReport: (id) => {
    const state = readState();
    const report = findReport(state, id);
    if (!report) return Promise.resolve({ success: false, message: "报销单不存在", data: null });
    if (report.status !== "draft") return Promise.resolve({ success: false, message: "只有草稿状态的报销单可以删除", data: null });
    report.deleted_at = nowIso();
    writeState(state);
    return response(null, "报销单已删除");
  },

  updateReportStatus: (id, status) => {
    const state = readState();
    const report = findReport(state, id);
    if (!report) return Promise.resolve({ success: false, message: "报销单不存在", data: null });
    const allowed = {
      draft: ["printed"],
      printed: ["draft", "reimbursed"],
      reimbursed: [],
    };
    if (report.status !== status && !allowed[report.status]?.includes(status)) {
      return Promise.resolve({ success: false, message: `不允许从 ${report.status} 流转到 ${status}`, data: null });
    }
    report.status = status;
    report.updated_at = nowIso();
    writeState(state);
    return response(enrichReport(report), "报销单状态已更新");
  },

  uploadInvoice: async ({ reportId, tripId, expenseCategory, file }) => {
    const state = readState();
    const report = findReport(state, reportId);
    if (!report) return { success: false, message: "报销单不存在", data: null };
    if (report.status === "reimbursed") return { success: false, message: "已报销状态不可修改", data: null };

    const fileType = detectFileType(file.name);
    const parsed =
      fileType === "xml"
        ? await parseXmlInvoice(file)
        : { invoice_no: null, invoice_date: null, amount: "0.00", raw: { source: fileType } };
    const invoice = {
      id: state.nextInvoiceId++,
      report_id: Number(reportId),
      trip_id: tripId ? Number(tripId) : null,
      expense_category: expenseCategory,
      file_path: file.name,
      file_name: file.name,
      file_url: await fileToDataUrl(file),
      file_type: fileType,
      invoice_no: parsed.invoice_no,
      invoice_date: parsed.invoice_date,
      amount: money(parsed.amount),
      amount_confirmed: fileType === "xml" && Number(parsed.amount) > 0,
      created_at: nowIso(),
      deleted_at: null,
    };
    report.invoices = report.invoices || [];
    report.invoices.push(invoice);
    recalculateReport(report);
    writeState(state);
    return response({ ...invoice, parsed }, "发票已上传");
  },

  updateInvoice: (id, payload) => {
    const state = readState();
    for (const report of state.reports) {
      const invoice = (report.invoices || []).find((item) => item.id === Number(id) && !item.deleted_at);
      if (invoice) {
        invoice.amount = money(payload.amount);
        invoice.amount_confirmed = Boolean(payload.amount_confirmed);
        recalculateReport(report);
        writeState(state);
        return response(invoice, "发票已更新");
      }
    }
    return Promise.resolve({ success: false, message: "发票不存在", data: null });
  },

  deleteInvoice: (id) => {
    const state = readState();
    for (const report of state.reports) {
      const invoice = (report.invoices || []).find((item) => item.id === Number(id) && !item.deleted_at);
      if (invoice) {
        invoice.deleted_at = nowIso();
        recalculateReport(report);
        writeState(state);
        return response(null, "发票已删除");
      }
    }
    return Promise.resolve({ success: false, message: "发票不存在", data: null });
  },

  getInvoiceFileUrl: (id) => {
    const state = readState();
    for (const report of state.reports) {
      const invoice = (report.invoices || []).find((item) => item.id === Number(id));
      if (invoice?.file_url) return invoice.file_url;
    }
    return "";
  },
};
