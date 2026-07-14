import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// GitHub Pages의 사전 빌드본에서도 Firebase 설정이 사라지지 않도록
// 환경변수가 없을 때 현재 GW ONE 프로젝트 설정을 사용합니다.
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyC9m9qf_l-dFC0IBTKuMWEnpOnu_aIY7Fo",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "gwworklog.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    "gwworklog",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "gwworklog.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    "793745384638",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:793745384638:web:600ba37bdc7026b2c0eaef"
};

export const firebaseReady = Object.values(firebaseConfig).every(Boolean);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });

export { auth, db, googleProvider };
