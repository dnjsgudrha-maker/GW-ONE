import { useEffect } from "react";
import { LEAK_OPTIONS } from "../constants";
import { generateLeakOpinion } from "../utils/leakOpinion";
import { Field } from "./Common";

function OptionGroup({ title, options, selected, onToggle }) {
  return (
    <div className="leak-option-group">
      <strong>{title}</strong>
      <div className="choice-grid">
        {options.map((item) => (
          <button
            type="button"
            key={item}
            className={selected.includes(item) ? "choice active" : "choice"}
            onClick={() => onToggle(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LeakOpinionEngine({
  leakData,
  setLeakData,
  job
}) {
  const toggle = (key, item) => {
    const selected = leakData[key] || [];
    const next = selected.includes(item)
      ? selected.filter((value) => value !== item)
      : [...selected, item];

    setLeakData((current) => ({ ...current, [key]: next }));
  };

  const generated = generateLeakOpinion(leakData, job);

  useEffect(() => {
    setLeakData((current) => {
      if (current.opinionText === generated) return current;
      return { ...current, opinionText: generated };
    });
  }, [generated, setLeakData]);

  return (
    <div className="form-section leak-engine">
      <div className="leak-engine-title">
        <div>
          <h3>누수 전용 소견서 엔진</h3>
          <p>확인한 항목만 선택하면 소견서 초안이 자동으로 만들어집니다.</p>
        </div>
        <span>무료 템플릿</span>
      </div>

      <OptionGroup
        title="1. 점검 및 탐지"
        options={LEAK_OPTIONS.tests}
        selected={leakData.tests}
        onToggle={(item) => toggle("tests", item)}
      />

      <div className="two-column">
        <Field label="압력 변화">
          <input
            value={leakData.pressureDrop}
            onChange={(event) =>
              setLeakData({ ...leakData, pressureDrop: event.target.value })
            }
            placeholder="예: 10분 동안 0.2bar 감소"
          />
        </Field>

        <Field label="누수 위치">
          <input
            value={leakData.leakLocation}
            onChange={(event) =>
              setLeakData({ ...leakData, leakLocation: event.target.value })
            }
            placeholder="예: 주방 싱크대 하부 바닥"
          />
        </Field>
      </div>

      <OptionGroup
        title="2. 개방 및 굴착"
        options={LEAK_OPTIONS.openings}
        selected={leakData.openings}
        onToggle={(item) => toggle("openings", item)}
      />

      <OptionGroup
        title="3. 배관 종류"
        options={LEAK_OPTIONS.pipes}
        selected={leakData.pipes}
        onToggle={(item) => toggle("pipes", item)}
      />

      <OptionGroup
        title="4. 확인 원인"
        options={LEAK_OPTIONS.causes}
        selected={leakData.causes}
        onToggle={(item) => toggle("causes", item)}
      />

      <OptionGroup
        title="5. 보수 내용"
        options={LEAK_OPTIONS.actions}
        selected={leakData.actions}
        onToggle={(item) => toggle("actions", item)}
      />

      <OptionGroup
        title="6. 작업 결과"
        options={LEAK_OPTIONS.results}
        selected={leakData.results}
        onToggle={(item) => toggle("results", item)}
      />

      <Field label="추가 문구">
        <textarea
          rows="3"
          value={leakData.extraNote}
          onChange={(event) =>
            setLeakData({ ...leakData, extraNote: event.target.value })
          }
          placeholder="예: 다른 구간의 누수 여부는 지속적인 관찰이 필요합니다."
        />
      </Field>

      <div className="leak-opinion-preview">
        <div>
          <strong>자동 생성 소견서</strong>
          <small>내용을 직접 수정해도 저장됩니다.</small>
        </div>
        <textarea
          rows="14"
          value={leakData.opinionText}
          onChange={(event) =>
            setLeakData({ ...leakData, opinionText: event.target.value })
          }
        />
      </div>
    </div>
  );
}
