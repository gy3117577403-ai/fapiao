import {
  Box,
  Button,
  Container,
  Divider,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SettingsIcon from "@mui/icons-material/Settings";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { pageBackground, tokens } from "../theme";

const navItems = [
  { label: "总览驾驶舱", to: "/", icon: <DashboardIcon fontSize="small" /> },
  { label: "报销单工作台", to: "/reports", icon: <ReceiptLongIcon fontSize="small" /> },
  { label: "基础设置", to: "/settings", icon: <SettingsIcon fontSize="small" /> },
];

const isActivePath = (pathname, target) => {
  if (target === "/") return pathname === "/";
  return pathname.startsWith(target);
};

function NavButton({ item, active, compact }) {
  return (
    <Button
      component={RouterLink}
      to={item.to}
      startIcon={compact ? undefined : item.icon}
      title={compact ? item.label : undefined}
      aria-label={item.label}
      fullWidth={!compact}
      sx={{
        justifyContent: compact ? "center" : "flex-start",
        minWidth: compact ? 40 : "auto",
        minHeight: compact ? 40 : 44,
        px: compact ? 1 : 1.5,
        position: "relative",
        color: active ? tokens.primaryDeep : tokens.muted,
        bgcolor: active ? "rgba(37,99,235,.1)" : "transparent",
        border: active ? "1px solid rgba(37,99,235,.22)" : "1px solid transparent",
        boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,.7)" : "none",
        "&::before": compact
          ? undefined
          : {
              content: '""',
              position: "absolute",
              left: 8,
              top: 10,
              bottom: 10,
              width: 3,
              borderRadius: 999,
              bgcolor: active ? tokens.primary : "transparent",
            },
        "& .MuiButton-startIcon": { ml: compact ? 0 : 1 },
        "&:hover": { bgcolor: active ? "rgba(37,99,235,.12)" : "rgba(255,255,255,.62)" },
      }}
    >
      {compact ? item.icon : item.label}
    </Button>
  );
}

export default function AppShell({ children }) {
  const location = useLocation();
  const compact = useMediaQuery("(max-width:900px)");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        color: tokens.navy,
        background: pageBackground,
      }}
    >
      {!compact && (
        <Box
          component="aside"
          sx={{
            width: 272,
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            borderRight: `1px solid ${tokens.border}`,
            background: "rgba(255,255,255,.72)",
            backdropFilter: "blur(22px)",
            boxShadow: "inset -1px 0 0 rgba(255,255,255,.72)",
            position: "sticky",
            top: 0,
            height: "100vh",
          }}
        >
          <Box sx={{ px: 1, py: 1.5 }}>
            <Typography variant="h6" fontWeight={900} color={tokens.navy}>
              财务驾驶舱
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Financial Command Center
            </Typography>
          </Box>
          <Stack spacing={1}>
            {navItems.map((item) => (
              <NavButton key={item.to} item={item} active={isActivePath(location.pathname, item.to)} />
            ))}
          </Stack>
          <Divider />
          <Button
            component={RouterLink}
            to="/reports/new"
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            sx={{ minHeight: 40, boxShadow: "0 10px 24px rgba(37,99,235,.2)" }}
          >
            新建报销单
          </Button>
          <Box sx={{ mt: "auto", p: 1.5, borderRadius: 3, bgcolor: "rgba(37,99,235,.08)", border: `1px solid ${tokens.border}` }}>
            <Typography variant="body2" fontWeight={800}>
              差旅报销工作流
            </Typography>
            <Typography variant="caption" color="text.secondary">
              填写、上传、确认、打印，一站式完成。
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box
          component="header"
          sx={{
            minHeight: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 2, md: 4 },
            borderBottom: `1px solid ${tokens.border}`,
            bgcolor: "rgba(255,255,255,.72)",
            backdropFilter: "blur(18px)",
            position: "sticky",
            top: 0,
            zIndex: 8,
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              出差旅费报销管理工具
            </Typography>
            <Typography variant="h6" sx={{ color: tokens.navy }}>
              企业级财务工作台
            </Typography>
          </Box>
          {compact && (
            <Stack direction="row" spacing={0.5}>
              {navItems.map((item) => (
                <NavButton key={item.to} item={item} active={isActivePath(location.pathname, item.to)} compact />
              ))}
            </Stack>
          )}
        </Box>

        <Container maxWidth={false} sx={{ maxWidth: 1520, mx: "auto", py: { xs: 2, md: 3 }, px: { xs: 2, md: 3.5 } }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
