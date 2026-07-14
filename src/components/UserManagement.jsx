import { useMemo, useState } from "react";
import { formatBusinessNumber } from "../utils/businessProfile";

export default function UserManagement({
  profiles,
  adminUids,
  currentUserUid,
  onApprove,
  onDisable,
  onRoleChange,
  onAdminToggle,
  onCreateWorker
}) {
  const [workerDraft, setWorkerDraft] = useState({
    representativeName: "",
    email: "",
    contact: "",
    businessName: "",
    businessNumber: "",
    role: "기사"
  });
  const [showAddWorker, setShowAddWorker] = useState(false);

  const sortedProfiles = useMemo(
    () => [...profiles].sort((a,b) => String(a.representativeName||a.email||"").localeCompare(String(b.representativeName||b.email||""), "ko")),
    [profiles]
  );

  const setWorkerField = (key, value) => setWorkerDraft((cur)=>({...cur,[key]:value}));

  const createWorker = async () => {
    if (!workerDraft.representativeName.trim()) return window.alert("작업자 이름을 입력해 주세요.");
    if (!workerDraft.email.trim()) return window.alert("로그인할 이메일을 입력해 주세요.");
    await onCreateWorker(workerDraft);
    setWorkerDraft({representativeName:"",email:"",contact:"",businessName:"",businessNumber:"",role:"기사"});
    setShowAddWorker(false);
  };

  return <section className="panel">
    <div className="panel-title user-management-title">
      <div><h2>작업자 관리</h2><p>작업자 추가와 권한을 관리합니다.</p></div>
      <button type="button" className="primary compact-button" onClick={()=>setShowAddWorker(v=>!v)}>{showAddWorker?"추가 취소":"+ 작업자 추가"}</button>
    </div>
    {showAddWorker && <div className="worker-add-card">
      <label><span>작업자 이름 *</span><input value={workerDraft.representativeName} onChange={e=>setWorkerField("representativeName",e.target.value)} /></label>
      <label><span>로그인 이메일 *</span><input type="email" value={workerDraft.email} onChange={e=>setWorkerField("email",e.target.value)} /></label>
      <label><span>연락처</span><input value={workerDraft.contact} onChange={e=>setWorkerField("contact",e.target.value)} /></label>
      <label><span>개인사업자 상호</span><input value={workerDraft.businessName} onChange={e=>setWorkerField("businessName",e.target.value)} /></label>
      <label><span>사업자등록번호</span><input inputMode="numeric" value={workerDraft.businessNumber} onChange={e=>setWorkerField("businessNumber",formatBusinessNumber(e.target.value))} placeholder="000-00-00000" /></label>
      <label><span>권한</span><select value={workerDraft.role} onChange={e=>setWorkerField("role",e.target.value)}><option value="기사">기사</option><option value="대표">대표</option></select></label>
      <button type="button" className="primary" onClick={createWorker}>작업자 등록</button>
      <p className="worker-add-guide">등록된 이메일로 처음 로그인하면 자동 연결됩니다.</p>
    </div>}
    <div className="user-list">{sortedProfiles.length===0?<div className="empty">등록된 사용자가 없습니다.</div>:sortedProfiles.map(profile=>{
      const isAdmin=adminUids.includes(profile.uid);
      return <article className="user-card" key={profile.uid||profile.email}>
        <div className="user-card-head"><div><strong>{profile.representativeName||profile.email||"이름 미등록"}</strong><span>{profile.email||"이메일 미등록"}</span></div><span className={profile.disabled?"status off":"status"}>{profile.disabled?"사용중지":profile.approved?"승인":"승인대기"}</span></div>
        <div className="user-card-grid">
          <div><span>권한</span><strong>{isAdmin?"최고관리자":profile.role||"기사"}</strong></div>
          <div><span>연락처</span><strong>{profile.contact||"-"}</strong></div>
          <div><span>상호</span><strong>{profile.businessName||"-"}</strong></div>
          <div><span>사업자번호</span><strong>{profile.businessNumber||"-"}</strong></div>
        </div>
        <div className="user-actions">
          {!profile.approved&&<button onClick={()=>onApprove(profile.uid)}>승인</button>}
          <button onClick={()=>onDisable(profile.uid,!profile.disabled)}>{profile.disabled?"사용 재개":"사용 중지"}</button>
          {!isAdmin&&<select value={profile.role||"기사"} onChange={e=>onRoleChange(profile.uid,e.target.value)}><option value="기사">기사</option><option value="대표">대표</option></select>}
          {profile.uid!==currentUserUid&&<button className={isAdmin?"danger":""} onClick={()=>onAdminToggle(profile.uid,!isAdmin)}>{isAdmin?"최고관리자 해제":"최고관리자 지정"}</button>}
        </div>
      </article>})}</div>
  </section>;
}
