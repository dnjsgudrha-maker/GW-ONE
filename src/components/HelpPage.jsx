export default function HelpPage({ onBack }) {
  return (
    <section className="panel help-page">
      <div className="panel-title">
        <div>
          <h2>사용방법</h2>
          <p>처음 사용하는 분도 이 순서만 기억하면 됩니다.</p>
        </div>
        <button className="text-button" onClick={onBack}>
          돌아가기
        </button>
      </div>

      <div className="help-step-list">
        <article>
          <span>1</span>
          <div>
            <strong>현황에서 ‘새 작업 입력’ 누르기</strong>
            <p>파란색 큰 버튼을 누르면 작업입력이 시작됩니다.</p>
          </div>
        </article>

        <article>
          <span>2</span>
          <div>
            <strong>주소와 연락처 입력</strong>
            <p>문자 캡처가 있으면 사진을 선택해 자동으로 불러올 수 있습니다.</p>
          </div>
        </article>

        <article>
          <span>3</span>
          <div>
            <strong>작업한 항목 선택</strong>
            <p>작업 템플릿에서 실제로 한 작업만 누르면 문장이 만들어집니다.</p>
          </div>
        </article>

        <article>
          <span>4</span>
          <div>
            <strong>금액과 결제방법 입력</strong>
            <p>현금, 계좌입금, 카드, 계산서를 나눠서 입력할 수 있습니다.</p>
          </div>
        </article>

        <article>
          <span>5</span>
          <div>
            <strong>저장 내용 확인 후 저장</strong>
            <p>마지막 확인창에서 주소와 금액을 확인한 뒤 저장하세요.</p>
          </div>
        </article>
      </div>

      <div className="help-tip-box">
        <strong>기억할 것</strong>
        <p>
          사진은 없어도 저장할 수 있습니다. 잘못 저장한 작업은 상세보기에서
          ‘작업일지 수정’을 누르면 고칠 수 있습니다.
        </p>
      </div>
    </section>
  );
}
