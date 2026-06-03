import { Tab, Tabs } from "@mui/material";
import { REIMBURSEMENT_STATUS_OPTIONS } from "../../utils/reimbursementList";
import { tokens } from "../../theme";

export default function ReimbursementStatusTabs({ value, counts, onChange }) {
  return (
    <Tabs
      value={value}
      onChange={(_event, nextValue) => onChange(nextValue)}
      variant="scrollable"
      sx={{
        px: 1.25,
        py: 1,
        minHeight: 0,
        borderBottom: `1px solid ${tokens.border}`,
        "& .MuiTabs-indicator": { display: "none" },
        "& .MuiTab-root": {
          minHeight: 34,
          px: 1.4,
          mr: 0.75,
          borderRadius: 2,
          border: "1px solid transparent",
          color: tokens.muted,
          transition: "background-color 180ms ease, border-color 180ms ease, color 180ms ease",
        },
        "& .Mui-selected": {
          color: `${tokens.primaryDeep} !important`,
          bgcolor: "rgba(239,246,255,.95)",
          borderColor: "rgba(37,99,235,.24)",
        },
      }}
    >
      {REIMBURSEMENT_STATUS_OPTIONS.map((tab) => (
        <Tab key={tab.value} value={tab.value} label={`${tab.label} ${counts[tab.value] ?? 0}`} />
      ))}
    </Tabs>
  );
}
