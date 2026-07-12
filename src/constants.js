export const JOB_TYPES = [
  "누수탐지",
  "하수구막힘",
  "변기막힘",
  "싱크대막힘",
  "고압세척",
  "수전교체",
  "배관공사",
  "방수",
  "기타"
];

export const EQUIPMENT = [
  "내시경",
  "고압세척기",
  "열화상카메라",
  "청음기",
  "가스탐지기",
  "관로탐지기",
  "공압기",
  "샤프트",
  "스프링",
  "굴삭기"
];

export const PAYMENT_METHODS = [
  "현금",
  "계좌입금",
  "카드",
  "계산서 발행"
];

export const initialProfile = {
  businessName: "",
  representativeName: "",
  businessNumber: "",
  contact: "",
  businessEmail: "",
  businessAddress: "",
  stampDataUrl: "",
  stampUrl: "",
  documentBusinesses: []
};

export const createInitialForm = () => ({
  workDate: new Date().toISOString().slice(0, 10),
  phone: "",
  address: "",
  jobType: "누수탐지",
  worker: "",
  issuerBusinessId: "own",
  issuerBusinessSnapshot: null,
  workContent: "",
  result: "",
  asPeriod: "1년",
  memo: "",
  followUpDate: "",
  followUpType: "재방문",
  followUpMemo: "",
  equipment: [],
  chargeAmount: "",
  baseChargeAmount: "",
  taxAddedPayment: "",
  commissionType: "percent",
  commissionRate: "30",
  commissionFixedAmount: "",
  paymentMethod: "계좌입금",
  paymentBreakdown: {
    cash: "",
    transfer: "",
    card: "",
    invoice: ""
  }
});


export const createInitialLeakData = () => ({
  tests: [],
  openings: [],
  pipes: [],
  causes: [],
  actions: [],
  results: [],
  pressureDrop: "",
  leakLocation: "",
  extraNote: "",
  opinionText: ""
});

export const LEAK_OPTIONS = {
  tests: [
    "계량기 테스트",
    "직수 압력 테스트",
    "온수 압력 테스트",
    "난방 압력 테스트",
    "공압 테스트",
    "가스 탐지",
    "청음 탐지",
    "열화상 탐지",
    "관로 탐지",
    "내시경 확인"
  ],
  openings: [
    "바닥 굴착",
    "벽체 개방",
    "천장 개방",
    "점검구 개방"
  ],
  pipes: [
    "PB 배관",
    "XL 배관",
    "동배관",
    "강관",
    "PPC 배관",
    "PVC 배관",
    "메타폴 배관",
    "에이콘 배관"
  ],
  causes: [
    "엘보 크랙",
    "티 크랙",
    "배관 크랙",
    "배관 부식",
    "연결부 이탈",
    "테프론 부족",
    "가스켓 손상",
    "본딩 이탈",
    "배관 눌림",
    "원인 미확정"
  ],
  actions: [
    "누수 부위 확인",
    "손상 부위 절단",
    "배관 부분 교체",
    "부속 교체",
    "연결부 재시공",
    "보온재 복구",
    "몰탈 미장",
    "실리콘 마감"
  ],
  results: [
    "보수 완료",
    "압력 정상 유지",
    "누수 없음 확인",
    "통수 확인",
    "추가 관찰 필요",
    "추가 공사 협의 필요"
  ]
};
