import { Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import ReportEdit from "./pages/ReportEdit";
import ReportList from "./pages/ReportList";
import ReportPrint from "./pages/ReportPrint";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reports" element={<ReportList />} />
        <Route path="/reports/new" element={<ReportEdit />} />
        <Route path="/reports/:id/edit" element={<ReportEdit />} />
        <Route path="/reports/:id/print" element={<ReportPrint />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  );
}
