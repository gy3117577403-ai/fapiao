import { useEffect, useMemo, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

const toNumber = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0, duration = 500, compact = false }) {
  const target = toNumber(value);
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(target);
      return undefined;
    }
    const start = display;
    const diff = target - start;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  const text = useMemo(() => {
    const formatter = new Intl.NumberFormat("zh-CN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      notation: compact ? "compact" : "standard",
    });
    return `${prefix}${formatter.format(display)}${suffix}`;
  }, [compact, decimals, display, prefix, suffix]);

  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{text}</span>;
}
