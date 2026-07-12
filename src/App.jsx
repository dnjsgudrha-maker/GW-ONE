import { useEffect, useMemo, useRef, useState } from "react";
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
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import {
  auth,
  db,
  firebaseReady,
  googleProvider
} from "./firebase";
import {
  createInitialForm,
  createInitialLeakData,
  initialProfile
} from "./constants";
import { getCustomerHistory } from "./utils/customers";
import {
  DEFAULT_STAMP_DATA_URL,
  imageFileToDataUrl,
  isValidBusinessNumber
} from "./utils/businessProfile";
import { resolveDocumentBusiness } from "./utils/businesses";
import {
  existingPhotoItem,
  hasFailedPhotos,
  hasPendingPhotos,
  photoUrls
} from "./utils/cloudinary";
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
  const [jobAlert, setJobAlert] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(
    () => ("Notification" in window ? Notification.permission : "unsupported")
  );
  const notificationListenerReady = useRef(false);
  const jobAlertTimer = useRef(null);



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
          snapshot.docs.map((item) => {
            const ownerUid =
              item.data().ownerUid ||
              item.ref.parent.parent?.id ||
              "";

            return {
              id: item.id,
              ownerUid,
              jobPath: item.ref.path,
              ...item.data()
            };
          })
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
        setJobs(
          snapshot.docs.map((item) => ({
            id: item.id,
            ownerUid: item.data().ownerUid || user.uid,
            jobPath: item.ref.path,
            ...item.data()
          }))
        ),
      (error) => setNotice(`목록을 불러오지 못했습니다: ${error.message}`)
    );
  }, [user]);



  useEffect(() => {
    if (!user || !db) {
      notificationListenerReady.current = false;
      return;
    }

    const canReceiveJobAlerts =
      isAdmin || profile.role === "대표";

    if (!canReceiveJobAlerts) {
      notificationListenerReady.current = false;
      return;
    }

    const alertsQuery = query(
      collection(db, "jobNotifications"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    return onSnapshot(
      alertsQuery,
      (snapshot) => {
        // 첫 연결 때 과거 알림이 한꺼번에 뜨는 것을 막습니다.
        if (!notificationListenerReady.current) {
          notificationListenerReady.current = true;
          return;
        }

        const added = snapshot
          .docChanges()
          .filter((change) => change.type === "added")
          .map((change) => ({
            id: change.doc.id,
            ...change.doc.data()
          }))
          .filter((alert) => alert.actorUid !== user.uid);

        if (!added.length) return;

        const alert = added[0];
        const actorName =
          alert.actorName ||
          alert.actorEmail ||
          "작업자";
        const message =
          `${actorName} 작업자가 ${alert.jobType || "작업"}을 등록했습니다.`;

        setJobAlert({
          ...alert,
          message
        });

        if (jobAlertTimer.current) {
          clearTimeout(jobAlertTimer.current);
        }

        jobAlertTimer.current = setTimeout(() => {
          setJobAlert(null);
        }, 9000);

        if (
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification("GW ONE 작업 등록", {
            body: `${message}\n${alert.address || ""}`,
            icon: `${import.meta.env.BASE_URL}pwa-192x192.png`,
            tag: `gw-one-job-${alert.id}`
          });
        }
      },
      (error) => {
        setNotice(`작업 등록 알림을 불러오지 못했습니다: ${error.message}`);
      }
    );
  }, [user, isAdmin, profile.role]);

  useEffect(
    () => () => {
      if (jobAlertTimer.current) clearTimeout(jobAlertTimer.current);
    },
    []
  );

  const enableJobNotifications = async () => {
    if (!("Notification" in window)) {
      setNotice("이 기기에서는 브라우저 알림을 지원하지 않습니다.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      setNotice("작업 등록 알림을 켰습니다.");
    } else {
      setNotice("브라우저에서 알림 권한이 허용되지 않았습니다.");
    }
  };

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
  // 카드·세금계산서의 10% 추가금은 수수료 계산에서 제외합니다.
  // 예: 원금 100,000원 + 카드 10% = 청구 110,000원
  //     수수료 30%는 110,000원이 아닌 원금 100,000원의 30,000원
  const commissionBaseAmount =
    Number(String(form.baseChargeAmount || "").replace(/,/g, "")) ||
    chargeAmount;
  const commissionAmount =
    commissionType === "fixed"
      ? commissionFixedAmount
      : Math.round((commissionBaseAmount * commissionRate) / 100);
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

    if (!isValidBusinessNumber(profile.businessNumber)) {
      setNotice("사업자등록번호 10자리를 확인해 주세요.");
      return;
    }

    setProfileSaving(true);
    setNotice("");

    try {
      let stampDataUrl =
        profile.stampDataUrl ||
        profile.stampUrl ||
        DEFAULT_STAMP_DATA_URL;

      if (stampFile?.file) {
        stampDataUrl = await imageFileToDataUrl(stampFile.file);
      }

      const savedProfile = {
        ...profile,
        stampDataUrl,
        stampUrl: "",
        uid: user.uid,
        email: user.email || "",
        updatedAt: serverTimestamp()
      };

      await setDoc(
        doc(db, "profiles", user.uid),
        savedProfile,
        { merge: true }
      );

      setProfile(savedProfile);

      if (stampFile?.previewUrl) {
        URL.revokeObjectURL(stampFile.previewUrl);
      }

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
      issuerBusinessId: job.issuerBusinessId || "own",
      issuerBusinessSnapshot: job.issuerBusinessSnapshot || {
        id: job.issuerBusinessId || "saved",
        businessName: job.businessName || "",
        representativeName: job.representativeName || "",
        businessNumber: job.businessNumber || "",
        contact: job.businessContact || "",
        businessEmail: job.businessEmail || "",
        businessAddress: job.businessAddress || "",
        stampDataUrl: job.stampDataUrl || ""
      },
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
      issuerBusinessId: job.issuerBusinessId || "own",
      issuerBusinessSnapshot: job.issuerBusinessSnapshot || {
        id: job.issuerBusinessId || "saved",
        businessName: job.businessName || "",
        representativeName: job.representativeName || "",
        businessNumber: job.businessNumber || "",
        contact: job.businessContact || "",
        businessEmail: job.businessEmail || "",
        businessAddress: job.businessAddress || "",
        stampDataUrl: job.stampDataUrl || ""
      },
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

    setBeforePhotos(
      (job.beforePhotoUrls || []).map((url, index) =>
        existingPhotoItem(url, index)
      )
    );
    setDuringPhotos(
      (job.duringPhotoUrls || []).map((url, index) =>
        existingPhotoItem(url, index)
      )
    );
    setAfterPhotos(
      (job.afterPhotoUrls || []).map((url, index) =>
        existingPhotoItem(url, index)
      )
    );
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
      const allPhotoItems = [
        ...beforePhotos,
        ...duringPhotos,
        ...afterPhotos
      ];

      if (hasPendingPhotos(allPhotoItems)) {
        setNotice("사진 업로드가 끝난 뒤 저장해 주세요.");
        return false;
      }

      if (hasFailedPhotos(allPhotoItems)) {
        setNotice("업로드에 실패한 사진을 다시 시도하거나 삭제해 주세요.");
        return false;
      }

      const beforePhotoUrls = photoUrls(beforePhotos);
      const duringPhotoUrls = photoUrls(duringPhotos);
      const afterPhotoUrls = photoUrls(afterPhotos);

      const selectedBusiness = resolveDocumentBusiness(
        profile,
        form.issuerBusinessId || "own",
        form.issuerBusinessSnapshot
      );

      const commonData = {
        ...form,
        issuerBusinessId: selectedBusiness.id || "own",
        issuerBusinessSnapshot: selectedBusiness,
        chargeAmount,
        commissionType,
        commissionRate,
        commissionBaseAmount,
        commissionFixedAmount,
        commissionAmount,
        netAmount,
        paymentBreakdown,
        paymentTotal,
        paymentDifference: chargeAmount - paymentTotal,
        businessName:
          selectedBusiness.businessName?.trim() || "GW배관솔루션",
        representativeName:
          selectedBusiness.representativeName?.trim() || "",
        businessNumber: selectedBusiness.businessNumber?.trim() || "",
        businessContact: selectedBusiness.contact?.trim() || "",
        businessEmail: selectedBusiness.businessEmail?.trim() || "",
        businessAddress: selectedBusiness.businessAddress?.trim() || "",
        stampDataUrl:
          selectedBusiness.stampDataUrl ||
          profile.stampDataUrl ||
          profile.stampUrl ||
          DEFAULT_STAMP_DATA_URL,
        stampUrl: "",
        leakData: form.jobType === "누수탐지" ? leakData : null,
        leakOpinion:
          form.jobType === "누수탐지" ? leakData.opinionText || "" : "",
        ownerUid: user.uid,
        ownerEmail: user.email || "",
        updatedAt: serverTimestamp()
      };

      if (editingJob) {
        const beforePhotoUrlsFinal = beforePhotoUrls;
        const duringPhotoUrlsFinal = duringPhotoUrls;
        const afterPhotoUrlsFinal = afterPhotoUrls;

        const editingOwnerUid = editingJob.ownerUid || user.uid;

        await updateDoc(
          doc(db, "users", editingOwnerUid, "jobs", editingJob.id),
          {
            ...commonData,
            ownerUid: editingOwnerUid,
            ownerEmail: editingJob.ownerEmail || commonData.ownerEmail,
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
        const createdJobRef = await addDoc(
          collection(db, "users", user.uid, "jobs"),
          {
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
          }
        );

        // 작업 저장 성공과 알림 저장은 분리합니다.
        // 알림이 실패해도 작업일지는 정상 저장됩니다.
        try {
          await addDoc(collection(db, "jobNotifications"), {
            jobId: createdJobRef.id,
            ownerUid: user.uid,
            actorUid: user.uid,
            actorEmail: user.email || "",
            actorName:
              form.worker ||
              profile.representativeName ||
              user.displayName ||
              "작업자",
            jobType: form.jobType || "작업",
            address: form.address || "",
            chargeAmount,
            createdAt: serverTimestamp()
          });
        } catch (notificationError) {
          console.warn("작업 알림 저장 실패:", notificationError);
        }
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

  const handleDelete = async (job) => {
    if (!job?.id) return;

    const ownerUid = job.ownerUid || user.uid;
    const isOwnJob = ownerUid === user.uid;

    if (!isAdmin && !isOwnJob) {
      setNotice("다른 사용자의 작업일지는 최고관리자만 삭제할 수 있습니다.");
      return;
    }

    const ownerName =
      allProfiles.find((item) => item.uid === ownerUid)?.representativeName ||
      job.worker ||
      "해당 사용자";

    const message = isOwnJob
      ? "이 작업일지를 삭제할까요?"
      : `${ownerName}님이 작성한 작업일지를 최고관리자 권한으로 삭제할까요?`;

    if (!window.confirm(message)) return;

    try {
      await deleteDoc(doc(db, "users", ownerUid, "jobs", job.id));
      setSelectedJob(null);
      setNotice("작업일지를 삭제했습니다.");
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

  const currentRole = isAdmin ? "최고관리자" : profile.role || "기사";
  const canViewSettlement =
    currentRole === "최고관리자" || currentRole === "대표";
  const canManageUsers = currentRole === "최고관리자";

  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthCount = jobs.filter((job) =>
    job.workDate?.startsWith(thisMonth)
  ).length;

  return (
    <div className={largeText ? "app-shell large-text-mode" : "app-shell"}>
      <NetworkBanner />

      {jobAlert && (
        <button
          type="button"
          className="job-registration-alert"
          onClick={() => {
            const matchedJob = allJobs.find(
              (job) =>
                job.id === jobAlert.jobId &&
                (job.ownerUid || "") === (jobAlert.ownerUid || "")
            );

            if (matchedJob) setSelectedJob(matchedJob);
            setJobAlert(null);
          }}
        >
          <span className="job-alert-icon">🔔</span>
          <div>
            <strong>{jobAlert.message}</strong>
            <small>
              {jobAlert.address || "주소 미입력"}
              {jobAlert.chargeAmount
                ? ` · ${Number(jobAlert.chargeAmount).toLocaleString()}원`
                : ""}
            </small>
          </div>
          <span className="job-alert-close">×</span>
        </button>
      )}

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
            commissionBaseAmount={commissionBaseAmount}
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
            onEnableNotifications={enableJobNotifications}
            notificationPermission={notificationPermission}
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
          onDelete={() => handleDelete(selectedJob)}
          canDelete={
            isAdmin || (selectedJob.ownerUid || user.uid) === user.uid
          }
          canEdit={
            isAdmin || (selectedJob.ownerUid || user.uid) === user.uid
          }
          isSuperAdmin={isAdmin}
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
