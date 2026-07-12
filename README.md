# GW ONE v3.1 GitHub Edition

현장 작업일지, 고객관리, 월정산, 사용자관리, 사진관리, 문서출력을 위한 웹앱입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

프로젝트 루트에 `.env` 파일이 필요합니다.

## GitHub Pages 배포

1. 저장소의 `Settings → Secrets and variables → Actions`
2. 아래 Repository secrets 6개 등록
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. `Settings → Pages → Source`를 `GitHub Actions`로 설정
4. `main` 브랜치에 Push하면 자동 배포

## 주의

- `.env` 파일은 GitHub에 올리지 않습니다.
- Firebase Authentication의 승인된 도메인에 `dnjsgudrha-maker.github.io`를 추가해야 합니다.
