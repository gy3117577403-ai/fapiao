import {
  Button,
  Chip,
  FormControl,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import GlassCard from "../ui/GlassCard";
import {
  REIMBURSEMENT_STATUS_OPTIONS,
  buildFilterChips,
  clearReimbursementFilter,
  hasActiveReimbursementFilters,
} from "../../utils/reimbursementList";
import { tokens } from "../../theme";

export default function ReimbursementFilterBar({
  filters,
  onFiltersChange,
  onReset,
  onSubmit,
  filteredCount,
  totalCount,
}) {
  const chips = buildFilterChips(filters);
  const hasFilters = hasActiveReimbursementFilters(filters);

  const updateFilter = (field, value) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const clearChip = (key) => {
    onFiltersChange(clearReimbursementFilter(filters, key));
  };

  return (
    <GlassCard>
      <Stack spacing={1.5}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} lg={3.2}>
            <TextField
              fullWidth
              placeholder="搜索出差事由 / 出差人 / 部门"
              value={filters.keyword}
              onChange={(event) => updateFilter("keyword", event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3} lg={1.7}>
            <TextField
              fullWidth
              label="开始日期"
              type="date"
              value={filters.startDate}
              onChange={(event) => updateFilter("startDate", event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} sm={3} lg={1.7}>
            <TextField
              fullWidth
              label="结束日期"
              type="date"
              value={filters.endDate}
              onChange={(event) => updateFilter("endDate", event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3} lg={1.7}>
            <FormControl fullWidth size="small">
              <Select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
                {REIMBURSEMENT_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} lg={1.3}>
            <TextField
              fullWidth
              label="最小金额"
              type="number"
              value={filters.minAmount}
              onChange={(event) => updateFilter("minAmount", event.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start">¥</InputAdornment> }}
              inputProps={{ min: 0, step: "0.01" }}
            />
          </Grid>
          <Grid item xs={6} sm={3} lg={1.3}>
            <TextField
              fullWidth
              label="最大金额"
              type="number"
              value={filters.maxAmount}
              onChange={(event) => updateFilter("maxAmount", event.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start">¥</InputAdornment> }}
              inputProps={{ min: 0, step: "0.01" }}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={2.1}>
            <Stack direction="row" spacing={1} justifyContent={{ sm: "flex-end" }}>
              <Button variant="contained" onClick={onSubmit}>
                查询
              </Button>
              <Button variant="outlined" onClick={onReset} disabled={!hasFilters}>
                重置
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {hasFilters ? `当前筛选 ${filteredCount} 条 / 共 ${totalCount} 条` : `共 ${totalCount} 条记录`}
          </Typography>
          {chips.length > 0 && (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {chips.map((chip) => (
                <Chip
                  key={chip.key}
                  label={chip.label}
                  onDelete={() => clearChip(chip.key)}
                  size="small"
                  sx={{
                    bgcolor: "rgba(239,246,255,.9)",
                    border: `1px solid ${tokens.border}`,
                    fontWeight: 700,
                  }}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </GlassCard>
  );
}
