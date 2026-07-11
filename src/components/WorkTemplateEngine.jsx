import { useMemo, useState } from "react";
import {
  WORK_TEMPLATES,
  generateResultText,
  generateWorkText
} from "../utils/workTemplates";

export default function WorkTemplateEngine({
  jobType,
  form,
  setForm
}) {
  const template = WORK_TEMPLATES[jobType];
  const [selected, setSelected] = useState([]);

  const preview = useMemo(
    () => generateWorkText(jobType, selected),
    [jobType, selected]
  );

  if (!template) return null;

  const toggle = (item) => {
    setSelected((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    );
  };

  const apply = () => {
    const result = generateResultText(jobType, selected);

    setForm({
      ...form,
      workContent: preview || form.workContent,
      result: result || form.result
    });
  };

  const selectAll = () => {
    setSelected(template.checks);
  };

  const clearAll = () => {
    setSelected([]);
  };

  return (
    <div className="form-section work-template-engine">
      <div className="template-engine-head">
        <div>
          <h3>{jobType} 작업 템플릿</h3>
          <p>실제로 진행한 항목만 선택하고 작업내용에 반영하세요.</p>
        </div>
        <span>무료 자동작성</span>
      </div>

      <div className="template-quick-buttons">
        <button type="button" onClick={selectAll}>
          전체 선택
        </button>
        <button type="button" onClick={clearAll}>
          선택 해제
        </button>
      </div>

      <div className="choice-grid">
        {template.checks.map((item) => (
          <button
            type="button"
            key={item}
            className={selected.includes(item) ? "choice active" : "choice"}
            onClick={() => toggle(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="template-preview">
        <span>생성될 작업내용</span>
        <p>{preview || "항목을 선택하면 문장이 표시됩니다."}</p>
      </div>

      <button
        type="button"
        className="primary template-apply-button"
        onClick={apply}
        disabled={!selected.length}
      >
        작업내용에 반영
      </button>
    </div>
  );
}
