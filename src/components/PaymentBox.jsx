import {
  formatWon,
  formatNumericInput,
  rawNumericValue
} from "../utils/formatters";
import { numberValue } from "../utils/settlement";
import { Field } from "./Common";

const FIELDS = [
  ["cash", "현금"],
  ["transfer", "계좌입금"],
  ["card", "카드"],
  ["invoice", "계산서 발행"]
];

const QUICK_AMOUNTS = [
  ["5만", 50000],
  ["10만", 100000],
  ["20만", 200000],
  ["30만", 300000],
  ["50만", 500000],
  ["100만", 1000000]
];

const QUICK_RATES = ["10", "15", "20", "25", "30", "40"];

export default function PaymentBox({
  form,
  setForm,
  chargeAmount,
  commissionAmount,
  netAmount
}) {
  const payment = form.paymentBreakdown || {
    cash: "",
    transfer: "",
    card: "",
    invoice: ""
  };

  const commissionType = form.commissionType || "percent";

  const paymentTotal = FIELDS.reduce(
    (sum, [key]) => sum + numberValue(payment[key]),
    0
  );

  const difference = chargeAmount - paymentTotal;

  const updatePayment = (key, value) => {
    setForm({
      ...form,
      paymentBreakdown: {
        ...payment,
        [key]: rawNumericValue(value)
      }
    });
  };

  const setChargeAmount = (amount) => {
    setForm({
      ...form,
      chargeAmount: String(amount)
    });
  };

  const fillAll = (key) => {
    setForm({
      ...form,
      paymentBreakdown: {
        cash: "",
        transfer: "",
        card: "",
        invoice: "",
        [key]: String(chargeAmount || "")
      }
    });
  };

  const setCommissionType = (type) => {
    setForm({
      ...form,
      commissionType: type,
      commissionFixedAmount:
        type === "fixed" ? form.commissionFixedAmount || "" : "",
      commissionRate:
        type === "percent" ? form.commissionRate || "30" : form.commissionRate
    });
  };

  return (
    <div className="form-section easy-payment-section">
      <h3>금액 입력</h3>

      <Field label="청구금액">
        <input
          className="easy-large-input payment-main-input"
          inputMode="numeric"
          value={formatNumericInput(form.chargeAmount)}
          onChange={(event) =>
            setForm({
              ...form,
              chargeAmount: rawNumericValue(event.target.value)
            })
          }
          placeholder="예: 350,000"
        />
      </Field>

      <div className="quick-amount-row">
        {QUICK_AMOUNTS.map(([label, amount]) => (
          <button
            type="button"
            key={label}
            onClick={() => setChargeAmount(amount)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="charge-summary">
        <span>청구금액</span>
        <strong>{formatWon(chargeAmount)}</strong>
      </div>

      <div className="commission-box">
        <div className="commission-box-head">
          <strong>수수료 입력</strong>
          <span>요율 또는 금액 중 하나를 선택하세요.</span>
        </div>

        <div className="commission-type-toggle">
          <button
            type="button"
            className={commissionType === "percent" ? "active" : ""}
            onClick={() => setCommissionType("percent")}
          >
            % 요율로 계산
          </button>
          <button
            type="button"
            className={commissionType === "fixed" ? "active" : ""}
            onClick={() => setCommissionType("fixed")}
          >
            금액 직접 입력
          </button>
        </div>

        {commissionType === "percent" ? (
          <>
            <div className="commission-rate-row">
              {QUICK_RATES.map((rate) => (
                <button
                  type="button"
                  key={rate}
                  className={
                    String(form.commissionRate) === rate ? "active" : ""
                  }
                  onClick={() =>
                    setForm({
                      ...form,
                      commissionType: "percent",
                      commissionRate: rate
                    })
                  }
                >
                  {rate}%
                </button>
              ))}
            </div>

            <Field label="다른 요율 직접 입력">
              <div className="commission-custom-input">
                <input
                  inputMode="decimal"
                  value={form.commissionRate || ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      commissionType: "percent",
                      commissionRate: event.target.value.replace(/[^\d.]/g, "")
                    })
                  }
                  placeholder="예: 17.5"
                />
                <span>%</span>
              </div>
            </Field>
          </>
        ) : (
          <Field label="수수료 금액">
            <input
              className="easy-large-input"
              inputMode="numeric"
              value={formatNumericInput(form.commissionFixedAmount)}
              onChange={(event) =>
                setForm({
                  ...form,
                  commissionType: "fixed",
                  commissionFixedAmount: rawNumericValue(event.target.value)
                })
              }
              placeholder="예: 45,000"
            />
          </Field>
        )}

        <div className="commission-result-grid">
          <div>
            <span>수수료</span>
            <strong>{formatWon(commissionAmount)}</strong>
          </div>
          <div>
            <span>정산금액</span>
            <strong>{formatWon(netAmount)}</strong>
          </div>
        </div>
      </div>

      <div className="split-payment-box">
        <div className="easy-payment-guide">
          <strong>어떻게 받았나요?</strong>
          <span>
            한 가지 방법으로 전부 받았다면 ‘전액’을 누르세요.
            여러 방법으로 받았다면 금액을 나눠 입력하세요.
          </span>
        </div>

        <div className="split-payment-grid">
          {FIELDS.map(([key, label]) => (
            <div className="split-payment-item" key={key}>
              <div className="split-payment-label">
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => fillAll(key)}
                  disabled={!chargeAmount}
                >
                  전액
                </button>
              </div>
              <input
                inputMode="numeric"
                value={formatNumericInput(payment[key] || "")}
                onChange={(event) => updatePayment(key, event.target.value)}
                placeholder="0"
              />
            </div>
          ))}
        </div>

        <div className="payment-check-box">
          <div>
            <span>받은 금액 합계</span>
            <strong>{formatWon(paymentTotal)}</strong>
          </div>
          <div className={difference === 0 ? "payment-match" : "payment-mismatch"}>
            <span>청구금액과 비교</span>
            <strong>
              {difference === 0
                ? "일치"
                : `${difference > 0 ? "부족 " : "초과 "}${formatWon(
                    Math.abs(difference)
                  )}`}
            </strong>
          </div>
        </div>

        {chargeAmount > 0 && difference !== 0 && (
          <p className="payment-warning">
            저장하려면 청구금액과 받은 금액 합계를 같게 맞춰 주세요.
          </p>
        )}
      </div>
    </div>
  );
}
