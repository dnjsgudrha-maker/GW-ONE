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
  ["invoice", "세금계산서"]
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
const TAX_KEYS = new Set(["card", "invoice"]);

function roundedTaxIncluded(amount) {
  return Math.round(Number(amount || 0) * 1.1);
}

export default function PaymentBox({
  form,
  setForm,
  chargeAmount,
  commissionAmount,
  commissionBaseAmount,
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

  const getBaseAmount = () => {
    const savedBase = Number(form.baseChargeAmount || 0);
    if (savedBase > 0) return savedBase;
    return Number(chargeAmount || 0);
  };

  const resetPayment = (key, amount) => ({
    cash: "",
    transfer: "",
    card: "",
    invoice: "",
    [key]: String(amount || "")
  });

  const updatePayment = (key, value) => {
    setForm({
      ...form,
      paymentBreakdown: {
        ...payment,
        [key]: rawNumericValue(value)
      }
    });
  };

  // 버튼은 교체가 아니라 계속 더해집니다.
  // 예: 10만 + 5만 = 15만, 10만 + 10만 = 20만
  const addChargeAmount = (amount) => {
    const base = getBaseAmount();
    const nextBase = base + amount;
    const taxKey = form.taxAddedPayment || "";
    const nextCharge = TAX_KEYS.has(taxKey)
      ? roundedTaxIncluded(nextBase)
      : nextBase;

    setForm({
      ...form,
      baseChargeAmount: String(nextBase),
      chargeAmount: String(nextCharge),
      paymentBreakdown: TAX_KEYS.has(taxKey)
        ? resetPayment(taxKey, nextCharge)
        : form.paymentBreakdown
    });
  };

  const changeChargeAmount = (value) => {
    const raw = rawNumericValue(value);

    setForm({
      ...form,
      chargeAmount: raw,
      baseChargeAmount: raw,
      taxAddedPayment: "",
      paymentBreakdown: {
        cash: "",
        transfer: "",
        card: "",
        invoice: ""
      }
    });
  };

  const clearChargeAmount = () => {
    setForm({
      ...form,
      chargeAmount: "",
      baseChargeAmount: "",
      taxAddedPayment: "",
      paymentBreakdown: {
        cash: "",
        transfer: "",
        card: "",
        invoice: ""
      }
    });
  };

  const fillAll = (key) => {
    const base = getBaseAmount();

    if (TAX_KEYS.has(key)) {
      const taxIncluded = roundedTaxIncluded(base);

      setForm({
        ...form,
        baseChargeAmount: String(base),
        chargeAmount: String(taxIncluded),
        taxAddedPayment: key,
        paymentMethod: key === "card" ? "카드" : "계산서 발행",
        paymentBreakdown: resetPayment(key, taxIncluded)
      });
      return;
    }

    setForm({
      ...form,
      baseChargeAmount: String(base),
      chargeAmount: String(base),
      taxAddedPayment: "",
      paymentMethod: key === "cash" ? "현금" : "계좌입금",
      paymentBreakdown: resetPayment(key, base)
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
          onChange={(event) => changeChargeAmount(event.target.value)}
          placeholder="예: 350,000"
        />
      </Field>

      <div className="quick-amount-header">
        <span>누를 때마다 금액이 더해집니다.</span>
        <button type="button" onClick={clearChargeAmount}>
          금액 초기화
        </button>
      </div>

      <div className="quick-amount-row">
        {QUICK_AMOUNTS.map(([label, amount]) => (
          <button
            type="button"
            key={label}
            onClick={() => addChargeAmount(amount)}
          >
            + {label}
          </button>
        ))}
      </div>

      <div className="charge-summary">
        <span>
          청구금액
          {TAX_KEYS.has(form.taxAddedPayment) && (
            <small> · 10% 포함</small>
          )}
        </span>
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

        <div className="commission-base-guide">
          <span>수수료 계산 기준</span>
          <strong>{formatWon(commissionBaseAmount)}</strong>
          {chargeAmount !== commissionBaseAmount && (
            <small>
              카드·세금계산서 10% 추가금은 수수료 계산에서 제외
            </small>
          )}
        </div>

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
            현금·계좌입금은 원래 금액으로 입력됩니다.
            카드·세금계산서의 ‘전액’을 누르면 10%가 자동으로 추가됩니다.
          </span>
        </div>

        <div className="split-payment-grid">
          {FIELDS.map(([key, label]) => (
            <div className="split-payment-item" key={key}>
              <div className="split-payment-label">
                <span>
                  {label}
                  {TAX_KEYS.has(key) && <small> +10%</small>}
                </span>
                <button
                  type="button"
                  onClick={() => fillAll(key)}
                  disabled={!getBaseAmount()}
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
