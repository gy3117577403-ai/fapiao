import { Grid } from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PrintIcon from "@mui/icons-material/Print";
import MetricCard from "../ui/MetricCard";
import { tokens } from "../../theme";

const stats = [
  { key: "all", title: "全部报销单", description: "当前已加载记录", icon: <ArticleIcon />, color: tokens.primary },
  { key: "draft", title: "草稿", description: "待完善或待打印", icon: <HourglassEmptyIcon />, color: tokens.muted },
  { key: "printed", title: "已打印", description: "待完成报销", icon: <PrintIcon />, color: tokens.info },
  { key: "reimbursed", title: "已报销", description: "已完成归档", icon: <CheckCircleIcon />, color: tokens.success },
  { key: "pending", title: "待确认发票", description: "需要处理金额", icon: <ErrorOutlineIcon />, color: tokens.warning },
];

export default function ReimbursementWorkbenchStats({ counts, activeStatus, onStatusChange, loading }) {
  return (
    <Grid container spacing={1.5}>
      {stats.map((item) => (
        <Grid item xs={12} sm={6} md={2.4} key={item.key}>
          <MetricCard
            title={item.title}
            value={counts[item.key] ?? 0}
            description={item.description}
            icon={item.icon}
            color={item.color}
            loading={loading}
            selected={activeStatus === item.key}
            onClick={() => onStatusChange(activeStatus === item.key ? "all" : item.key)}
          />
        </Grid>
      ))}
    </Grid>
  );
}
