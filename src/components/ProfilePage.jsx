import ProfileBox from "./ProfileBox";

export default function ProfilePage(props) {
  return (
    <section className="panel">
      <div className="panel-title">
        <div>
          <h2>내 업체정보</h2>
          <p>한 번만 입력하면 문서에 자동으로 들어갑니다.</p>
        </div>
        <button className="text-button" onClick={props.onBack}>뒤로</button>
      </div>
      <ProfileBox {...props} />
    </section>
  );
}
