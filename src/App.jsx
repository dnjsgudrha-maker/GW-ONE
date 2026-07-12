import { useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "firebase/auth";
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes
} from "firebase/storage";
import {
  auth,
  db,
  firebaseReady,
  googleProvider,
  storage
} from "./firebase";
import {
  createInitialForm,
  createInitialLeakData,
  initialProfile
} from "./constants";
import { getCustomerHistory } from "./utils/customers";
import { compressImages } from "./utils/images";
import { CenteredCard } from "./components/Common";
import JobForm from "./components/JobForm";
import JobList from "./components/JobList";
import JobModal from "./components/JobModal";
import DocumentModal from "./components/DocumentModal";
import CustomerList from "./components/CustomerList";
import CustomerModal from "./components/CustomerModal";
import LoginScreen from "./components/LoginScreen";
import TopBar from "./components/TopBar";
import MonthlySettlement from "./components/MonthlySettlement";
import UserManagement from "./components/UserManagement";
import PendingScreen from "./components/PendingScreen";
import WorkDashboard from "./components/WorkDashboard";
import MoreMenu from "./components/MoreMenu";
import ProfilePage from "./components/ProfilePage";
import NetworkBanner from "./components/NetworkBanner";
import HelpPage from "./components/HelpPage";
import { downloadJsonBackup } from "./utils/backup";

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(firebaseReady);
  const [view, setView] = useState("dashboard");
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(initialProfile);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [stampFile, setStampFile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [form, setForm] = useState(createInitialForm());
  const [leakData, setLeakData] = useState(createInitialLeakData());
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [duringPhotos, setDuringPhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [documentType, setDocumentType] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [adminUids, setAdminUids] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [draftReady, setDraftReady] = useState(false);
  const [largeText, setLargeText] = useState(
    () => localStorage.getItem("gw-one-large-text") === "on"
  );



  useEffect(() => {
    localStorage.setItem("gw-one-large-text", largeText ? "on" : "off");
  }, [largeText]);


  useEffect(() => {
    if (!firebaseReady) return;

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);


  useEffect(() => {
    if (!user || !db) {
      setProfile(initialProfile);
      setProfileLoaded(false);
      return;
    }

    const profileRef = doc(db, "profiles", user.uid);

    const unsubscribe = onSnapshot(
      profileRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          setProfile({
            ...initialProfile,
            approved: true,
            disabled: false,
            ...snapshot.data()
          });
        } else {
          const newProfile = {
            ...initialProfile,
            uid: user.uid,
            email: user.email || "",
            representativeName: user.displayName || "",
            approved: false,
            disabled: false,
            role: "기사",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          await setDoc(profileRef, newProfile);
          setProfile(newProfile);
        }

        setProfileLoaded(true);
      },
      (error) => {
        setNotice(`내 정보를 불러오지 못했습니다: ${error.message}`);
        setProfileLoaded(true);
      }
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user || !db) {
      setIsAdmin(false);
      return;
    }

    return onSnapshot(
      doc(db, "admins", user.uid),
      (snapshot) => setIsAdmin(snapshot.exists()),
      () => setIsAdmin(false)
    );
  }, [user]);

  useEffect(() => {
    if (!user || !db || !isAdmin) {
      setAllProfiles([]);
      setAdminUids([]);
      return;
    }

    const unsubscribeProfiles = onSnapshot(
      collection(db, "profiles"),
      (snapshot) => {
        setAllProfiles(
          snapshot.docs.map((item) => ({
            uid: item.id,
            ...item.data()
          }))
        );
      },
      (error) => setNotice(`사용자 목록을 불러오지 못했습니다: ${error.message}`)
    );

    const unsubscribeAdmins = onSnapshot(
      collection(db, "admins"),
      (snapshot) => setAdminUids(snapshot.docs.map((item) => item.id)),
      (error) => setNotice(`관리자 목록을 불러오지 못했습니다: ${error.message}`)
    );

    return () => {
      unsubscribeProfiles();
      unsubscribeAdmins();
    };
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user || !db) {
      setAllJobs([]);
      return;
    }

    const role = isAdmin ? "관리자" : profile.role || "기사";

    if (role === "기사") {
      setAllJobs(jobs);
      return;
    }

    return onSnapshot(
      collectionGroup(db, "jobs"),
      (snapshot) => {
        setAllJobs(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }))
        );
      },
      (error) => setNotice(`전체 작업현황을 불러오지 못했습니다: ${error.message}`)
    );
  }, [user, isAdmin, profile.role, jobs]);

  useEffect(() => {
    if (!user || !db) {
      setJobs([]);
      return;
    }

    const jobsQuery = query(
      collection(db, "users", user.uid, "jobs"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      jobsQuery,
      (snapshot) =>
        setJobs(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
      (error) => setNotice(`목록을 불러오지 못했습니다: ${error.message}`)
    );
  }, [user]);


  useEffect(() => {
    if (!user || editingJob || view !== "form") return;
    const timer = setTimeout(() => {
      localStorage.setItem(
        `gw-one-draft-${user.uid}`,
        JSON.stringify({ form, leakData, savedAt: Date.now() })
      );
      setDraftReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [user, editingJob, view, form, leakData]);

  const restoreDraft = () => {
    if (!user) return false;
    const raw = localStorage.getItem(`gw-one-draft-${user.uid}`);
    if (!raw) return false;
    try {
      const draft = JSON.parse(raw);
      if (!draft?.form?.address && !draft?.form?.workContent) return false;
      setForm({ ...createInitialForm(), ...draft.form });
      setLeakData({ ...createInitialLeakData(), ...(draft.leakData || {}) });
      setView("form");
      setNotice("작성 중이던 내용을 불러왔습니다.");
      return true;
    } catch {
      return false;
    }
  };

  const clearDraft = () => {
    if (user) localStorage.removeItem(`gw-one-draft-${user.uid}`);
    setDraftReady(false);
  };

  const filteredJobs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return jobs;

    return jobs.filter((job) =>
      [
        job.workDate,
        job.phone,
        job.address,
        job.jobType,
        job.worker,
        job.workContent,
        job.result,
        job.memo,
        job.businessName,
        job.paymentMethod,
        ...(job.equipment || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [jobs, search]);

  const chargeAmount =
    Number(String(form.chargeAmount).replace(/,/g, "")) || 0;
  const commissionType = form.commissionType || "percent";
  const commissionRate = Number(form.commissionRate) || 0;
  const commissionFixedAmount =
    Number(String(form.commissionFixedAmount || "").replace(/,/g, "")) || 0;
  const commissionAmount =
    commissionType === "fixed"
      ? commissionFixedAmount
      : Math.round((chargeAmount * commissionRate) / 100);
  const netAmount = Math.max(chargeAmount - commissionAmount, 0);
  const paymentBreakdown = form.paymentBreakdown || {
    cash: "",
    transfer: "",
    card: "",
    invoice: ""
  };
  const paymentTotal =
    Number(paymentBreakdown.cash || 0) +
    Number(paymentBreakdown.transfer || 0) +
    Number(paymentBreakdown.card || 0) +
    Number(paymentBreakdown.invoice || 0);

  const uploadPhotoGroup = async (files, folder) => {
    if (!files.length) return [];

    const urls = [];
    const compressedFiles = await compressImages(files);

    for (let index = 0; index < compressedFiles.length; index += 1) {
      const file = compressedFiles[index];
      const safeName = file.name.replace(/[^\w.\-가-힣]/g, "_");
      const fileRef = ref(
        storage,
        `users/${user.uid}/jobs/${Date.now()}_${index}_${folder}_${safeName}`
      );

      await uploadBytes(fileRef, file, {
        contentType: file.type || "image/jpeg"
      });
      urls.push(await getDownloadURL(fileRef));
    }

    return urls;
  };

  const handleLogin = async () => {
    setNotice("");

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setNotice(`로그인하지 못했습니다: ${error.message}`);
    }
  };

  const handleProfileSave = async () => {
    if (!profile.businessName.trim() || !profile.representativeName.trim()) {
      setNotice("상호명과 대표자명은 꼭 입력해 주세요.");
      return;
    }

    setProfileSaving(true);
    setNotice("");

    try {
      let stampUrl = profile.stampUrl || "";

      if (stampFile) {
        const safeName = stampFile.name.replace(/[^\w.\-가-힣]/g, "_");
        const stampRef = ref(
          storage,
          `users/${user.uid}/profile/stamp_${Date.now()}_${safeName}`
        );

        await uploadBytes(stampRef, stampFile);
        stampUrl = await getDownloadURL(stampRef);
      }

      await setDoc(
        doc(db, "profiles", user.uid),
        {
          ...profile,
          stampUrl,
          uid: user.uid,
          email: user.email || "",
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      setProfile((current) => ({ ...current, stampUrl }));
      setStampFile(null);
      setNotice("내 업체정보를 저장했습니다.");
    } catch (error) {
      setNotice(`내 업체정보를 저장하지 못했습니다: ${error.message}`);
    } finally {
      setProfileSaving(false);
    }
  };



  const openNewJobForm = () => {
    if (user) {
      const raw = localStorage.getItem(`gw-one-draft-${user.uid}`);
      if (raw && window.confirm("작성 중이던 작업이 있습니다. 이어서 작성할까요?")) {
        restoreDraft();
        return;
      }
    }

    setEditingJob(null);
    setForm((current) => ({
      ...createInitialForm(),
      worker:
        profile.representativeName ||
        user.displayName ||
        current.worker ||
        ""
    }));
    setLeakData(createInitialLeakData());
    setBeforePhotos([]);
    setDuringPhotos([]);
    setAfterPhotos([]);
    setView("form");
    setNotice("");
  };

  const copyJob = (job) => {
    setEditingJob(null);
    setForm({
      ...createInitialForm(),
      phone: job.phone || "",
      address: job.address || "",
      jobType: job.jobType || "누수탐지",
      worker: job.worker || "",
      workContent: job.workContent || "",
      result: job.result || "",
      asPeriod: job.asPeriod || "1년",
      memo: job.memo || "",
      followUpDate: "",
      followUpType: job.followUpType || "재방문",
      followUpMemo: "",
      equipment: job.equipment || [],
      chargeAmount: String(job.chargeAmount || ""),
      baseChargeAmount: String(job.baseChargeAmount || job.chargeAmount || ""),
      taxAddedPayment: job.taxAddedPayment || "",
      commissionType:
        job.commissionType ||
        (Number(job.commissionFixedAmount || 0) > 0 ? "fixed" : "percent"),
      commissionRate: String(job.commissionRate ?? "30"),
      commissionFixedAmount: String(
        job.commissionFixedAmount ??
          (job.commissionType === "fixed" ? job.commissionAmount || "" : "")
      ),
      paymentMethod: job.paymentMethod || "계좌입금",
      paymentBreakdown: {
        cash: "",
        transfer: "",
        card: "",
        invoice: ""
      }
    });

    setLeakData(
      job.leakData
        ? {
            ...job.leakData,
            opinionText: ""
          }
        : createInitialLeakData()
    );

    setBeforePhotos([]);
    setDuringPhotos([]);
    setAfterPhotos([]);
    setSelectedJob(null);
    setView("form");
    setNotice("이전 작업을 복사했습니다. 날짜와 금액을 확인해 주세요.");
  };

  const startEditJob = (job) => {
    setEditingJob(job);
    setForm({
      workDate: job.workDate || new Date().toISOString().slice(0, 10),
      phone: job.phone || "",
      address: job.address || "",
      jobType: job.jobType || "누수탐지",
      worker: job.worker || "",
      workContent: job.workContent || "",
      result: job.result || "",
      asPeriod: job.asPeriod || "1년",
      memo: job.memo || "",
      followUpDate: "",
      followUpType: job.followUpType || "재방문",
      followUpMemo: "",
      equipment: job.equipment || [],
      chargeAmount: String(job.chargeAmount || ""),
      baseChargeAmount: String(job.baseChargeAmount || job.chargeAmount || ""),
      taxAddedPayment: job.taxAddedPayment || "",
      commissionType:
        job.commissionType ||
        (Number(job.commissionFixedAmount || 0) > 0 ? "fixed" : "percent"),
      commissionRate: String(job.commissionRate ?? "30"),
      commissionFixedAmount: String(
        job.commissionFixedAmount ??
          (job.commissionType === "fixed" ? job.commissionAmount || "" : "")
      ),
      paymentMethod: job.paymentMethod || "계좌입금",
      paymentBreakdown: job.paymentBreakdown || {
        cash: job.paymentMethod === "현금" ? String(job.chargeAmount || "") : "",
        transfer: job.paymentMethod === "계좌입금" ? String(job.chargeAmount || "") : "",
        card: job.paymentMethod === "카드" ? String(job.chargeAmount || "") : "",
        invoice: job.paymentMethod === "계산서 발행" ? String(job.chargeAmount || "") : ""
      }
    });

    setLeakData(
      job.leakData || {
        ...createInitialLeakData(),
        opinionText: job.leakOpinion || ""
      }
    );

    setBeforePhotos([]);
    setDuringPhotos([]);
    setAfterPhotos([]);
    setSelectedJob(null);
    setView("form");
    setNotice("작업일지를 수정 중입니다.");
  };

  const cancelEdit = () => {
    setEditingJob(null);
    setForm(createInitialForm());
    setLeakData(createInitialLeakData());
    setBeforePhotos([]);
    setDuringPhotos([]);
    setAfterPhotos([]);
    setView("list");
    setNotice("");
  };

  const handleSave = async (event) => {
    event?.preventDefault?.();

    // 기사 계정은 개인 업체정보가 비어 있어도 작업을 저장할 수 있습니다.
    // 회사 기본 업체명은 저장 시 자동 적용합니다.
    if (!form.address.trim() || !form.workContent.trim()) {
      setNotice("현장 주소와 작업내용은 꼭 입력해 주세요.");
      return false;
    }

    if (chargeAmount > 0 && paymentTotal !== chargeAmount) {
      setNotice("청구금액과 결제 합계를 같게 입력해 주세요.");
      return false;
    }

    if (saving) return false;

    setSaving(true);
    setNotice("");

    try {
      const [beforePhotoUrls, duringPhotoUrls, afterPhotoUrls] =
        await Promise.all([
          uploadPhotoGroup(beforePhotos, "before"),
          uploadPhotoGroup(duringPhotos, "during"),
          uploadPhotoGroup(afterPhotos, "after")
        ]);

      const commonData = {
        ...form,
        chargeAmount,
        commissionType,
        commissionRate,
        commissionFixedAmount,
        commissionAmount,
        netAmount,
        paymentBreakdown,
        paymentTotal,
        paymentDifference: chargeAmount - paymentTotal,
        businessName: profile.businessName?.trim() || "GW배관솔루션",
        representativeName: profile.representativeName?.trim() || "",
        businessContact: profile.contact?.trim() || "",
        stampUrl: profile.stampUrl || "",
        leakData: form.jobType === "누수탐지" ? leakData : null,
        leakOpinion:
          form.jobType === "누수탐지" ? leakData.opinionText || "" : "",
        ownerUid: user.uid,
        ownerEmail: user.email || "",
        updatedAt: serverTimestamp()
      };

      if (editingJob) {
        const beforePhotoUrlsFinal = beforePhotoUrls.length
          ? beforePhotoUrls
          : editingJob.beforePhotoUrls || [];
        const duringPhotoUrlsFinal = duringPhotoUrls.length
          ? duringPhotoUrls
          : editingJob.duringPhotoUrls || [];
        const afterPhotoUrlsFinal = afterPhotoUrls.length
          ? afterPhotoUrls
          : editingJob.afterPhotoUrls || [];

        await updateDoc(
          doc(db, "users", user.uid, "jobs", editingJob.id),
          {
            ...commonData,
            beforePhotoUrls: beforePhotoUrlsFinal,
            duringPhotoUrls: duringPhotoUrlsFinal,
            afterPhotoUrls: afterPhotoUrlsFinal,
            photoUrls: [
              ...beforePhotoUrlsFinal,
              ...duringPhotoUrlsFinal,
              ...afterPhotoUrlsFinal
            ]
          }
        );
      } else {
        await addDoc(collection(db, "users", user.uid, "jobs"), {
          ...commonData,
          beforePhotoUrls,
          duringPhotoUrls,
          afterPhotoUrls,
          photoUrls: [
            ...beforePhotoUrls,
            ...duringPhotoUrls,
            ...afterPhotoUrls
          ],
          createdAt: serverTimestamp()
        });
      }

      setForm((current) => ({
        ...createInitialForm(),
        worker: current.worker,
        baseChargeAmount: "",
        taxAddedPayment: "",
        commissionType: current.commissionType || "percent",
        commissionRate: current.commissionRate || "30",
        commissionFixedAmount: "",
        paymentMethod: current.paymentMethod
      }));
      setLeakData(createInitialLeakData());
      setBeforePhotos([]);
      setDuringPhotos([]);
      setAfterPhotos([]);
      setEditingJob(null);
      clearDraft();
      setNotice(editingJob ? "작업일지를 수정했습니다." : "작업일지를 저장했습니다.");
      setView("list");
      return true;
    } catch (error) {
      setNotice(`저장하지 못했습니다: ${error.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm("이 작업일지를 삭제할까요?")) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "jobs", jobId));
      setSelectedJob(null);
    } catch (error) {
      setNotice(`삭제하지 못했습니다: ${error.message}`);
    }
  };


  const approveUser = async (uid) => {
    await updateDoc(doc(db, "profiles", uid), {
      approved: true,
      disabled: false,
      updatedAt: serverTimestamp()
    });
    setNotice("사용자를 승인했습니다.");
  };

  const disableUser = async (uid) => {
    if (!window.confirm("이 사용자의 이용을 중지할까요?")) return;

    await updateDoc(doc(db, "profiles", uid), {
      disabled: true,
      updatedAt: serverTimestamp()
    });
    setNotice("사용을 중지했습니다.");
  };

  const enableUser = async (uid) => {
    await updateDoc(doc(db, "profiles", uid), {
      approved: true,
      disabled: false,
      updatedAt: serverTimestamp()
    });
    setNotice("사용을 다시 허용했습니다.");
  };

  const changeUserRole = async (uid, role) => {
    await updateDoc(doc(db, "profiles", uid), {
      role,
      updatedAt: serverTimestamp()
    });
    setNotice(`사용자 역할을 ${role}(으)로 변경했습니다.`);
  };

  const makeAdmin = async (uid) => {
    await setDoc(doc(db, "admins", uid), {
      uid,
      createdAt: serverTimestamp(),
      createdBy: user.uid
    });
    setNotice("관리자로 지정했습니다.");
  };

  const removeAdmin = async (uid) => {
    if (!window.confirm("관리자 권한을 해제할까요?")) return;
    await deleteDoc(doc(db, "admins", uid));
    setNotice("관리자 권한을 해제했습니다.");
  };


  const installApp = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    setDeferredInstallPrompt(null);
  };

  if (!firebaseReady) {
    return (
      <CenteredCard
        title="Firebase 연결이 필요합니다"
        text=".env 파일의 Firebase 설정값을 확인해 주세요."
      />
    );
  }

  if (authLoading || (user && !profileLoaded)) {
    return (
      <CenteredCard
        title="GW ONE"
        text="로그인 정보를 확인하고 있습니다."
      />
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} notice={notice} />;
  }

  if (!isAdmin && (profile.approved === false || profile.disabled === true)) {
    return (
      <PendingScreen
        profile={profile}
        onLogout={() => signOut(auth)}
      />
    );
  }

  const customerHistory = getCustomerHistory(
    jobs,
    form.phone,
    form.address
  );

  const currentRole = isAdmin ? "관리자" : profile.role || "기사";
  const canViewSettlement =
    currentRole === "관리자" || currentRole === "대표";
  const canManageUsers = currentRole === "관리자";

  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthCount = jobs.filter((job) =>
    job.workDate?.startsWith(thisMonth)
  ).length;

  return (
    <div className={largeText ? "app-shell large-text-mode" : "app-shell"}>
      <NetworkBanner />
      <TopBar
        profile={profile}
        user={user}
        onLogout={() => signOut(auth)}
        role={currentRole}
      />

      <main className="content">
        {notice && <div className="notice">{notice}</div>}

        {view === "dashboard" && (
          <WorkDashboard
            jobs={currentRole === "기사" ? jobs : allJobs}
            profiles={allProfiles}
            currentRole={currentRole}
            onOpenJob={setSelectedJob}
            onCreateJob={openNewJobForm}
          />
        )}

        {view === "list" && (
          <JobList
            jobs={currentRole === "기사" ? jobs : allJobs}
            totalCount={
              currentRole === "기사" ? jobs.length : allJobs.length
            }
            monthCount={
              currentRole === "기사"
                ? thisMonthCount
                : allJobs.filter((job) =>
                    job.workDate?.startsWith(thisMonth)
                  ).length
            }
            search={search}
            setSearch={setSearch}
            onCreate={openNewJobForm}
            onSelect={setSelectedJob}
          />
        )}

        {view === "form" && (
          <JobForm
            profile={profile}
            setProfile={setProfile}
            stampFile={stampFile}
            setStampFile={setStampFile}
            onProfileSave={handleProfileSave}
            profileSaving={profileSaving}
            form={form}
            setForm={setForm}
            beforePhotos={beforePhotos}
            setBeforePhotos={setBeforePhotos}
            duringPhotos={duringPhotos}
            setDuringPhotos={setDuringPhotos}
            afterPhotos={afterPhotos}
            setAfterPhotos={setAfterPhotos}
            onSave={handleSave}
            saving={saving}
            onBack={() => setView("list")}
            onNotice={setNotice}
            chargeAmount={chargeAmount}
            commissionAmount={commissionAmount}
            netAmount={netAmount}
            customerHistory={customerHistory}
            leakData={leakData}
            setLeakData={setLeakData}
            editingJob={editingJob}
            onCancelEdit={cancelEdit}
          />
        )}

        {view === "customers" && (
          <CustomerList
            jobs={jobs}
            search={customerSearch}
            setSearch={setCustomerSearch}
            onSelect={setSelectedCustomer}
          />
        )}

        {view === "settlement" && canViewSettlement && (
          <MonthlySettlement
            jobs={currentRole === "기사" ? jobs : allJobs}
            onOpenJob={setSelectedJob}
          />
        )}

        {view === "users" && canManageUsers && (
          <UserManagement
            profiles={allProfiles}
            currentUid={user.uid}
            adminUids={adminUids}
            onApprove={approveUser}
            onDisable={disableUser}
            onEnable={enableUser}
            onMakeAdmin={makeAdmin}
            onRemoveAdmin={removeAdmin}
            onChangeRole={changeUserRole}
          />
        )}

        {view === "more" && (
          <MoreMenu
            role={currentRole}
            onOpenCustomers={() => setView("customers")}
            onOpenSettlement={() => setView("settlement")}
            onOpenUsers={() => setView("users")}
            onOpenProfile={() => setView("profile")}
            onOpenHelp={() => setView("help")}
            onInstall={installApp}
            onBackup={() =>
              downloadJsonBackup({
                jobs: currentRole === "기사" ? jobs : allJobs,
                profile,
                exportedBy: user.email || ""
              })
            }
            onToggleLargeText={() => setLargeText((current) => !current)}
            largeText={largeText}
            installAvailable={Boolean(deferredInstallPrompt)}
          />
        )}

        {view === "help" && (
          <HelpPage onBack={() => setView("more")} />
        )}

        {view === "profile" && (
          <ProfilePage
            profile={profile}
            setProfile={setProfile}
            stampFile={stampFile}
            setStampFile={setStampFile}
            onSave={handleProfileSave}
            onProfileSave={handleProfileSave}
            saving={profileSaving}
            profileSaving={profileSaving}
            onBack={() => setView("more")}
          />
        )}
      </main>

      <nav className="bottom-nav bottom-nav-simple">
        <button
          className={view === "dashboard" ? "active" : ""}
          onClick={() => setView("dashboard")}
        >
          <span>▦</span>
          현황
        </button>
        <button
          className={view === "list" ? "active" : ""}
          onClick={() => setView("list")}
        >
          <span>▤</span>
          작업목록
        </button>
        <button
          className={view === "form" ? "active" : ""}
          onClick={openNewJobForm}
        >
          <span>＋</span>
          작업입력
        </button>
        <button
          className={view === "more" || ["customers", "settlement", "users", "profile", "help"].includes(view) ? "active" : ""}
          onClick={() => setView("more")}
        >
          <span>•••</span>
          더보기
        </button>
      </nav>

      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onDelete={() => handleDelete(selectedJob.id)}
          onNotice={setNotice}
          onOpenDocument={setDocumentType}
          onEdit={() => startEditJob(selectedJob)}
          onCopy={() => copyJob(selectedJob)}
        />
      )}


      {selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onOpenJob={(job) => {
            setSelectedJob(job);
            setSelectedCustomer(null);
          }}
        />
      )}

      {selectedJob && documentType && (
        <DocumentModal
          type={documentType}
          job={selectedJob}
          onClose={() => setDocumentType(null)}
        />
      )}
    </div>
  );
}

export default App;
