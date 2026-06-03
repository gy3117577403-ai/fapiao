import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Alert, Stack } from "@mui/material";
import GlassCard from "../ui/GlassCard";
import ConfirmChecklist from "./ConfirmChecklist";
import FormSectionHeader from "./FormSectionHeader";
import SaveStatusIndicator from "./SaveStatusIndicator";

export default function RemarksConfirmSection({ checklist, saveState }) {
  return (
    <GlassCard>
      <Stack spacing={2}>
        <FormSectionHeader
          index={5}
          title="确认与检查"
          description="提交前检查只基于当前前端已有数据，不新增后端校验。"
        />
        <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: 2 }}>
          当前后端没有独立备注字段。如需补充说明，请填写在“基本信息”的出差事由中，提交结构保持不变。
        </Alert>
        <ConfirmChecklist items={checklist} />
        <SaveStatusIndicator state={saveState} />
      </Stack>
    </GlassCard>
  );
}
