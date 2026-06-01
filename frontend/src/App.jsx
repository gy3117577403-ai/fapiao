import {
  Box,
  Button,
  Container,
  CssBaseline,
  Divider,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SettingsIcon from "@mui/icons-material/Settings";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { Link as RouterLink, Route, Routes, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ReportEdit from "./pages/ReportEdit";
import ReportList from "./pages/ReportList";
import ReportPrint from "./pages/ReportPrint";
import Settings from "./pages/Settings";

const navItems = [
  { label: "总览看板", to: "/", icon: <DashboardIcon fontSize="small" /> },
  { label: "报销单管理", to: "/reports", icon: <ReceiptLongIcon fontSize="small" /> },
  { label: "基础设置", to: "/settings", icon: <SettingsIcon fontSize="small" /> },
];

const isActivePath = (pathname, target) => {
  if (target === "/") return pathname === "/";
  return pathname.startsWith(target);
};

function NavButton({ item, active }) {
  return (
    <Button
      component={RouterLink}
      to={item.to}
      startIcon={item.icon}
      fullWidth
      sx={{
        justifyContent: "flex-start",
        minHeight: 44,
        px: 1.5,
        color: active ? "#0F172A" : "#64748B",
        bgcolor: active ? "#E9F2FF" : "transparent",
        border: active ? "1px solid #B7D4FF" : "1px solid transparent",
        "&:hover": { bgcolor: active ? "#E9F2FF" : "#F4F6F8" },
      }}
    >
      {item.label}
    </Button>
  );
}

export default function App() {
  const location = useLocation();
  const compact = useMediaQuery("(max-width:900px)");

  return (
    <>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "#EEF2F6" }}>
        {!compact && (
          <Box
            component="aside"
            sx={{
              width: 248,
              p: 2,
              borderRight: "1px solid #D9E1EA",
              bgcolor: "#FBFCFE",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box sx={{ px: 1, py: 1.5 }}>
              <Typography variant="h6" fontWeight={800} color="#0F172A">
                发票报销
              </Typography>
              <Typography variant="body2" color="#64748B">
                Reimbursement
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
              sx={{ minHeight: 44 }}
            >
              新增报销单
            </Button>
          </Box>
        )}

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box
            component="header"
            sx={{
              minHeight: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: { xs: 2, md: 4 },
              borderBottom: "1px solid #D9E1EA",
              bgcolor: "rgba(255,255,255,0.82)",
              backdropFilter: "blur(10px)",
              position: "sticky",
              top: 0,
              zIndex: 5,
            }}
          >
            <Typography variant="h6" fontWeight={800} color="#0F172A">
              出差旅费报销管理工具
            </Typography>
            {compact && (
              <Stack direction="row" spacing={0.5}>
                {navItems.map((item) => (
                  <Button
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    color="inherit"
                    sx={{ minWidth: 40, px: 1 }}
                  >
                    {item.icon}
                  </Button>
                ))}
              </Stack>
            )}
          </Box>

          <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reports" element={<ReportList />} />
              <Route path="/reports/new" element={<ReportEdit />} />
              <Route path="/reports/:id/edit" element={<ReportEdit />} />
              <Route path="/reports/:id/print" element={<ReportPrint />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Container>
        </Box>
      </Box>
    </>
  );
}
