export const toNumber = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatAmount = (value, fallback = "¥0.00") => {
  if (value === null || value === undefined || value === "") return fallback;
  return `¥${toNumber(value).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatInteger = (value) => toNumber(value).toLocaleString("zh-CN", { maximumFractionDigits: 0 });

export const formatPercent = (value) => `${Math.round(toNumber(value) * 100)}%`;

export const parseLocalDate = (value) => {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDate = (value, fallback = "未填日期") => value || fallback;

export const isCurrentMonth = (value, now = new Date()) => {
  const parsed = parseLocalDate(value);
  return Boolean(parsed && parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth());
};

export const isCurrentYear = (value, now = new Date()) => {
  const parsed = parseLocalDate(value);
  return Boolean(parsed && parsed.getFullYear() === now.getFullYear());
};
