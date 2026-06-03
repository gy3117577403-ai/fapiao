import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import RouteIcon from "@mui/icons-material/Route";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import EmptyState from "../ui/EmptyState";
import GlassCard from "../ui/GlassCard";
import { tokens } from "../../theme";
import { calculateTripSegmentDays, safeCurrency, toNumber } from "../../utils/reimbursementForm";
import FormSectionHeader from "./FormSectionHeader";

const tripFields = [
  ["depart_month", "出发月", 1, 12],
  ["depart_day", "出发日", 1, 31],
  ["depart_hour", "出发时", 0, 23],
  ["depart_place", "出发地"],
  ["arrive_month", "到达月", 1, 12],
  ["arrive_day", "到达日", 1, 31],
  ["arrive_hour", "到达时", 0, 23],
  ["arrive_place", "到达地"],
];

const placeText = (trip) => `${trip.depart_place || "出发地"} -> ${trip.arrive_place || "到达地"}`;

function TripSummary({ trip, index, reportDate, dailySubsidy }) {
  const days = calculateTripSegmentDays(trip, reportDate);
  const subsidy = days * Math.max(0, toNumber(dailySubsidy));
  return (
    <Stack spacing={0.75}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography fontWeight={900}>行程 {index + 1}</Typography>
        <Typography variant="body2" color="text.secondary">
          {trip.depart_month}月{trip.depart_day}日 {trip.depart_hour !== "" ? `${trip.depart_hour}时` : ""}
          {"  "}至{"  "}
          {trip.arrive_month}月{trip.arrive_day}日 {trip.arrive_hour !== "" ? `${trip.arrive_hour}时` : ""}
        </Typography>
      </Stack>
      <Typography color={tokens.slate} fontWeight={800}>
        {placeText(trip)}
      </Typography>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Typography variant="caption" color="text.secondary">
          交通方式：{trip.transport || "未填写"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          天数：{days} 天
        </Typography>
        <Typography variant="caption" color="text.secondary">
          补贴：¥{safeCurrency(subsidy)}
        </Typography>
      </Stack>
    </Stack>
  );
}

export default function TripTimeline({
  trips,
  readonly,
  reportDate,
  dailySubsidy,
  addTrip,
  removeTrip,
  moveTrip,
  updateTrip,
  renderTripInvoices,
}) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const previousLength = useRef(trips.length);

  useEffect(() => {
    if (trips.length > previousLength.current) {
      setEditingIndex(trips.length - 1);
    }
    previousLength.current = trips.length;
  }, [trips.length]);

  const handleDelete = () => {
    if (deleteIndex === null) return;
    removeTrip(deleteIndex);
    setDeleteIndex(null);
    setEditingIndex(null);
  };

  return (
    <GlassCard>
      <Stack spacing={2}>
        <FormSectionHeader
          index={2}
          title="行程明细"
          description="以时间线编排每段出差行程，补贴天数和途中补贴会实时汇总。"
          action={
            <Button startIcon={<AddIcon />} variant="outlined" onClick={addTrip} disabled={readonly}>
              添加行程
            </Button>
          }
        />

        {trips.length === 0 ? (
          <EmptyState
            icon={<RouteIcon />}
            title="还没有添加行程"
            description="添加行程后，系统会自动计算补贴天数和途中补贴。"
            actionText="添加第一段行程"
            onAction={readonly ? undefined : addTrip}
            compact
          />
        ) : (
          <Stack spacing={1.25} sx={{ position: "relative", pl: { xs: 0, sm: 2.5 } }}>
            <Box
              sx={{
                display: { xs: "none", sm: "block" },
                position: "absolute",
                top: 10,
                bottom: 10,
                left: 13,
                width: 2,
                borderRadius: 999,
                bgcolor: "rgba(37,99,235,.14)",
              }}
            />
            {trips.map((trip, index) => {
              const isEditing = editingIndex === index;
              return (
                <Box key={trip.id || `trip-${index}`} sx={{ position: "relative" }}>
                  <Box
                    sx={{
                      display: { xs: "none", sm: "grid" },
                      position: "absolute",
                      left: -24,
                      top: 20,
                      width: 24,
                      height: 24,
                      placeItems: "center",
                      borderRadius: "50%",
                      bgcolor: tokens.primary,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 900,
                      boxShadow: "0 8px 18px rgba(37,99,235,.22)",
                    }}
                  >
                    {index + 1}
                  </Box>
                  <GlassCard
                    hover={!isEditing}
                    sx={{
                      animation: "tripIn 240ms ease both",
                      animationDelay: `${Math.min(index * 45, 220)}ms`,
                      "@keyframes tripIn": {
                        from: { opacity: 0, transform: "translateY(8px)" },
                        to: { opacity: 1, transform: "translateY(0)" },
                      },
                    }}
                  >
                    <Stack spacing={1.75}>
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
                        <TripSummary trip={trip} index={index} reportDate={reportDate} dailySubsidy={dailySubsidy} />
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="编辑">
                            <span>
                              <IconButton
                                aria-label={`编辑行程 ${index + 1}`}
                                title={`编辑行程 ${index + 1}`}
                                size="small"
                                disabled={readonly}
                                onClick={() => setEditingIndex(isEditing ? null : index)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="上移">
                            <span>
                              <IconButton
                                aria-label={`上移行程 ${index + 1}`}
                                title={`上移行程 ${index + 1}`}
                                size="small"
                                disabled={readonly || index === 0}
                                onClick={() => moveTrip(index, index - 1)}
                              >
                                <KeyboardArrowUpIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="下移">
                            <span>
                              <IconButton
                                aria-label={`下移行程 ${index + 1}`}
                                title={`下移行程 ${index + 1}`}
                                size="small"
                                disabled={readonly || index === trips.length - 1}
                                onClick={() => moveTrip(index, index + 1)}
                              >
                                <KeyboardArrowDownIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="删除">
                            <span>
                              <IconButton
                                aria-label={`删除行程 ${index + 1}`}
                                title={`删除行程 ${index + 1}`}
                                size="small"
                                color="error"
                                disabled={readonly}
                                onClick={() => setDeleteIndex(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </Stack>

                      <Collapse in={isEditing} timeout={240}>
                        <Stack spacing={1.5}>
                          <Divider />
                          <Grid container spacing={1.5}>
                            {tripFields.map(([field, label, min, max]) => (
                              <Grid item xs={6} md={3} key={field}>
                                <TextField
                                  fullWidth
                                  required={["depart_month", "depart_day", "arrive_month", "arrive_day"].includes(field)}
                                  label={label}
                                  type={typeof min === "number" ? "number" : "text"}
                                  value={trip[field]}
                                  disabled={readonly}
                                  onChange={(event) => updateTrip(index, field, event.target.value)}
                                  inputProps={typeof min === "number" ? { min, max } : undefined}
                                />
                              </Grid>
                            ))}
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="交通方式"
                                value={trip.transport}
                                disabled={readonly}
                                onChange={(event) => updateTrip(index, "transport", event.target.value)}
                              />
                            </Grid>
                          </Grid>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button variant="outlined" onClick={() => setEditingIndex(null)}>
                              取消
                            </Button>
                            <Button startIcon={<SaveOutlinedIcon />} variant="contained" onClick={() => setEditingIndex(null)}>
                              保存该行程
                            </Button>
                          </Stack>
                        </Stack>
                      </Collapse>

                      {renderTripInvoices?.(trip, index)}
                    </Stack>
                  </GlassCard>
                </Box>
              );
            })}
          </Stack>
        )}
      </Stack>

      <Dialog open={deleteIndex !== null} onClose={() => setDeleteIndex(null)}>
        <DialogTitle>确认删除行程</DialogTitle>
        <DialogContent>
          <DialogContentText>删除后右侧费用汇总会立即重新计算。确定要删除这段行程吗？</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteIndex(null)}>取消</Button>
          <Button color="error" onClick={handleDelete}>
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
    </GlassCard>
  );
}
