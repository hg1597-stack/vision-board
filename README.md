# 할 수 있다!! 선박금융!!

레트로 도트 게임풍 선박금융 업무 매뉴얼의 시작 화면과 신원 확인 잠금 화면입니다.
프레임워크 없이 `index.html`, `style.css`, `main.js`만으로 동작하며, 서버 없이 `file://` 환경에서 실행할 수 있습니다.

## 파일 구조

```text
.
├── index.html          # 정적 진입점
├── style.css           # CRT/픽셀 게임 UI 스타일
├── main.js             # 화면 흐름, Web Crypto 복호화 인증, 효과음
├── content.enc.js      # 암호화된 매뉴얼 본문과 감싼 데이터키
├── content/
│   └── manual.json     # 평문 작업 파일(.gitignore, 커밋 금지)
└── tools/
    └── encrypt.mjs     # manual.json -> content.enc.js 암호화 스크립트
```

## 실행 방법

1. 파일 탐색기에서 `index.html`을 더블클릭합니다.
2. 부팅 화면에서 `PRESS START`가 깜빡이면 클릭하거나 `Enter`/`Space`를 누릅니다.
3. 신원 확인 화면에서 허용된 이름을 입력하고 `[확인]`을 누릅니다.

별도 서버가 필요하지 않습니다. 최신 브라우저의 Web Crypto API가 필요합니다.

## 본문 수정 및 암호화 절차

`content/manual.json`은 평문 작업 파일이므로 `.gitignore`에 포함되어 있습니다. 배포/커밋되는 파일은 암호화된 `content.enc.js`입니다.

1. 로컬에서 `content/manual.json`을 수정합니다.
   - `authorizedNames`: 접근을 허용할 이름 목록
   - `manual`: 인증 후 표시할 매뉴얼 본문 데이터
2. 아래 명령으로 암호화 산출물을 갱신합니다.

   ```bash
   npm run encrypt
   ```

   또는:

   ```bash
   node tools/encrypt.mjs
   ```

3. 생성된 `content.enc.js`를 커밋합니다.
4. `content/manual.json`은 커밋하지 않습니다.

암호화 방식:

- 무작위 데이터키로 `manual` 객체를 AES-GCM 암호화합니다.
- 허용된 이름마다 PBKDF2-SHA-256, 310,000회 반복, 랜덤 salt로 감싼 키를 만들어 데이터키를 AES-GCM으로 감쌉니다.
- 브라우저는 입력값의 모든 공백을 제거한 뒤 복호화를 시도하고, 성공하면 인증 완료로 처리합니다.

## 테스트 방법

- 정답 흐름: 로컬 `content/manual.json`의 `authorizedNames` 중 하나를 입력합니다. 인증 완료 메시지와 반짝임 효과 후 임시 매뉴얼 화면이 표시됩니다.
- 오답 흐름: 허용되지 않은 아무 이름이나 입력합니다. `권한이 없습니다` 글리치 화면, CRT 전원 꺼짐 효과, 재부팅 버튼 표시까지 이어집니다.
- 공백 처리: 허용된 이름 사이에 공백을 넣어 입력해도 같은 이름으로 처리됩니다.
- 소리: 오른쪽 아래 `SOUND ON/OFF` 버튼으로 8비트 효과음을 음소거할 수 있습니다.
