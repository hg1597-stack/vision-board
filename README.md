# 할 수 있다!! 선박금융!!

레트로 도트 게임풍 선박금융 업무 매뉴얼입니다. 현재 구현 범위는 다음과 같습니다.

- 부팅 화면
- 신원 확인 잠금 화면
- 메인 메뉴
- 스테이지 선택
- `STAGE 0. 튜토리얼 마을`
- 회사별 업무 시 유의사항 패널
- NPC 카드 및 도감 화면

프레임워크 없이 `index.html`, `style.css`, `main.js`만으로 동작하며, 서버 없이 `file://` 환경에서 실행할 수 있습니다.

## 파일 구조

```text
.
├── index.html          # 정적 진입점
├── style.css           # CRT/픽셀 게임 UI 스타일
├── main.js             # 화면 흐름, 해시 라우팅, Web Crypto 인증, 효과음
├── content.enc.js      # 암호화된 매뉴얼 본문과 감싼 데이터키
├── content/
│   └── manual.json     # 평문 작업 파일(.gitignore, 커밋 금지)
└── tools/
    └── encrypt.mjs     # manual.json -> content.enc.js 암호화 스크립트
```

`*.docx`와 `content/manual.json`은 커밋하지 않습니다.

## 실행 방법

1. 파일 탐색기에서 `index.html`을 더블클릭합니다.
2. 부팅 화면에서 `PRESS START`가 깜빡이면 클릭하거나 `Enter`/`Space`를 누릅니다.
3. 신원 확인 화면에서 로컬 `content/manual.json`의 `authorizedNames` 중 하나를 입력하고 `[확인]`을 누릅니다.
4. 인증이 완료되면 메인 메뉴가 열립니다.

별도 서버가 필요하지 않습니다. 최신 브라우저의 Web Crypto API가 필요합니다.

## 화면 이동

인증 후 앱은 해시 라우팅을 사용합니다.

- `#/menu` - 메인 메뉴
- `#/stages` - 스테이지 선택
- `#/stage/0` - 튜토리얼 마을
- `#/stage/0/company/{companyId}` - 회사별 유의사항 및 NPC 카드
- `#/stage/0/company/{companyId}/npc/{npcId}` - NPC 도감

키보드:

- `Tab` - 브라우저 기본 포커스 이동
- `Enter`/`Space` - 선택
- `Arrow` 키 - 현재 화면의 주요 버튼 이동
- `Esc` - 메인 메뉴가 아닌 앱 화면에서 뒤로 이동

`[◀ 뒤로]` 버튼과 브라우저 뒤로 가기 모두 해시 라우트 기준으로 동작합니다.

## 로컬 저장소

방문 상태와 마지막 경로만 `localStorage`에 저장합니다. 모든 키는 `hsb-manual-` 접두어를 사용합니다.

- `hsb-manual-last-path`
- `hsb-manual-visited-stage-{stageId}`
- `hsb-manual-visited-npc-{npcId}`

체크리스트, 퀴즈, 점수, 클리어 상태는 구현하지 않았습니다.

## 본문 수정 및 암호화 절차

`content/manual.json`은 평문 작업 파일이므로 `.gitignore`에 포함되어 있습니다. 배포/커밋되는 파일은 암호화된 `content.enc.js`입니다.

1. 로컬에서 `content/manual.json`을 수정합니다.
   - `authorizedNames`: 접근을 허용할 이름 목록
   - `manual.appTitle`: 앱 제목
   - `manual.menu`: 메인 메뉴 문구
   - `manual.stages`: 스테이지 목록
2. 아래 명령으로 암호화 산출물을 갱신합니다.

   ```bash
   npm run encrypt
   ```

   또는:

   ```bash
   node tools/encrypt.mjs
   ```

3. 생성된 `content.enc.js`를 커밋합니다.
4. `content/manual.json`과 원본 Word 문서는 커밋하지 않습니다.

암호화 방식:

- 무작위 데이터키로 `manual` 객체를 AES-GCM 암호화합니다.
- 허용된 이름마다 PBKDF2-SHA-256, 310,000회 반복, 랜덤 salt로 감싼 키를 만들어 데이터키를 AES-GCM으로 감쌉니다.
- 브라우저는 입력값의 모든 공백을 제거한 뒤 복호화를 시도하고, 성공하면 인증 완료로 처리합니다.

## 스테이지 추가 방법

`content/manual.json`의 `manual.stages` 배열에 새 스테이지 객체를 추가합니다.

```json
{
  "id": "stage-1",
  "number": "STAGE 1",
  "title": "새 스테이지",
  "subtitle": "부제",
  "summary": "스테이지 설명",
  "intro": {
    "heading": "소개",
    "paragraphs": ["본문 문단"]
  },
  "companies": []
}
```

현재 UI는 `stage-0`만 열리도록 구현되어 있습니다. 다음 스테이지를 활성화하려면 `main.js`의 라우트 검증과 렌더링 대상을 확장한 뒤 `node tools/encrypt.mjs`를 실행합니다.

## 테스트 방법

- 정답 흐름: 로컬 `content/manual.json`의 `authorizedNames` 중 하나를 입력합니다. 인증 완료 메시지 후 메인 메뉴가 표시됩니다.
- 오답 흐름: 허용되지 않은 아무 이름이나 입력합니다. `권한이 없습니다` 글리치 화면, CRT 전원 꺼짐 효과, 재부팅 버튼 표시까지 이어집니다.
- 튜토리얼 마을: 메인 메뉴 → 스테이지 선택 → STAGE 0 → 회사 선택 → NPC 카드 선택 순서로 확인합니다.
- 뒤로 이동: `[◀ 뒤로]`, 브라우저 뒤로 가기, `Esc`를 각각 확인합니다.
- 소리: 오른쪽 아래 `SOUND ON/OFF` 버튼으로 8비트 효과음을 음소거할 수 있습니다.
