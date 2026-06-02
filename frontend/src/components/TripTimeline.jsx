import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import RouteIcon from "@mui/icons-material/Route";
import { Box, Button, Grid, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import EmptyState from "./ui/EmptyState";
import GlassCard from "./ui/GlassCard";
import { tokens } from "../theme";

export default function TripTimeline({
  trips,
  readonly,
  dragIndex,
  setDragIndex,
  addTrip,
  removeTrip,
  moveTrip,
  updateTrip,
  renderTripInvoices,
}) {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h6">行程明细</Typography>
          <Typography variant="body2" color="text.secondary">
            添加行程后，系统自动计算补贴天数和途中补贴
          </Typography>
        </Box>
        <Button startIcon={<AddIcon />} variant="outlined" onClick={addTrip} disabled={readonly}>
          添加行程
        </Button>
      </Stack>

      {trips.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<RouteIcon />}
            title="还没有添加行程"
            description="添加行程后，系统会自动计算补贴天数和途中补贴。"
            actionLabel="添加第一段行程"
            onAction={addTrip}
          />
        </GlassCard>
      ) : (
        <Stack spacing={1.4}>
          {trips.map((trip, index) => (
            <GlassCard
              key={trip.id || `new-${index}`}
              hover
              draggable={!readonly}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) moveTrip(dragIndex, index);
                setDragIndex(null);
              }}
              sx={{
                "@keyframes tripIn": {
                  from: { opacity: 0, transform: "translateY(8px) scale(.99)" },
                  to: { opacity: 1, transform: "translateY(0) scale(1)" },
                },
                animation: "tripIn 240ms ease both",
                animationDelay: `${Math.min(index * 45, 240)}ms`,
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "12px",
                        bgcolor: tokens.primarySoft,
                        color: tokens.primary,
                      }}
                    >
                      <DragIndicatorIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography fontWeight={800}>行程 {index + 1}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {trip.depart_place || "出发地"} → {trip.arrive_place || "到达地"}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="上移">
                      <span>
                        <IconButton aria-label="上移行程" size="small" disabled={readonly || index === 0} onClick={() => moveTrip(index, index - 1)}>
                          <KeyboardArrowUpIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="下移">
                      <span>
                        <IconButton
                          aria-label="下移行程"
                          size="small"
                          disabled={readonly || index === trips.length - 1}
                          onClick={() => moveTrip(index, index + 1)}
                        >
                          <KeyboardArrowDownIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="删除行程">
                      <span>
                        <IconButton aria-label="删除行程" size="small" color="error" disabled={readonly} onClick={() => removeTrip(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>

                <Grid container spacing={1.5}>
                  {[
                    ["depart_month", "出发月", 1, 12],
                    ["depart_day", "出发日", 1, 31],
                    ["depart_hour", "出发时", 0, 23],
                    ["depart_place", "出发地"],
                    ["arrive_month", "到达月", 1, 12],
                    ["arrive_day", "到达日", 1, 31],
                    ["arrive_hour", "到达时", 0, 23],
                    ["arrive_place", "到达地"],
                  ].map(([field, label, min, max]) => (
                    <Grid item xs={6} sm={3} key={field}>
                      <TextField
                        fullWidth
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

                {renderTripInvoices(trip, index)}
              </Stack>
            </GlassCard>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
