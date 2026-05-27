# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. https://console.firebase.google.com 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `vision-board-1gi`)
4. Google Analytics 옵션은 선택 사항

## 2. Firestore 데이터베이스 생성

1. 좌측 메뉴 → "Firestore Database" 클릭
2. "데이터베이스 만들기" 클릭
3. **테스트 모드**로 시작 (30일간 누구나 읽기/쓰기 가능)
4. 위치: `asia-northeast3 (서울)` 선택

## 3. 웹 앱 등록 및 설정 복사

1. 프로젝트 홈 → "앱 추가" → 웹 `</>` 아이콘 클릭
2. 앱 닉네임 입력 후 "앱 등록"
3. `firebaseConfig` 코드 복사

## 4. `src/firebase.js` 수정

복사한 설정을 붙여넣기:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123...:web:abc..."
};
```

## 5. Firestore 보안 규칙 (선택 사항)

테스트 모드 30일 만료 전, 규칙 탭에서 아래로 교체:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cards/{cardId} {
      allow read: if true;
      allow create: if request.resource.data.name is string
                    && request.resource.data.content is string
                    && request.resource.data.name.size() <= 20
                    && request.resource.data.content.size() <= 300;
    }
  }
}
```

## 6. 실행

```bash
cd vision-board
npm install
npm run dev
```

## 7. 배포 (Vercel 추천)

```bash
npm install -g vercel
vercel
```

또는 `npm run build` 후 `dist/` 폴더를 원하는 호스팅 서비스에 배포.
