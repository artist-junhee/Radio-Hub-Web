# RADIO HUB WEB

대한민국 전국 방송 및 해외 한인 라디오 실시간 인터넷 스트리밍 웹 플레이어입니다.

## 📻 프로젝트 개요

`라디오.txt` 원본 M3U 데이터를 기반으로 총 237개의 대한민국 전국 및 해외 한인 라디오 채널을 완벽하게 수록하고, 모바일·태블릿·데스크톱에서 최적화된 스트리밍 및 카테고리 관리 경험을 제공하는 웹 애플리케이션입니다.

- **데이터 보존**: 원본 방송국명, 스트림 URL 및 초기 카테고리 순서 100% 보존
- **하이브리드 재생 엔진**:
  - HLS (`.m3u8`): Safari/iOS 네이티브 HLS 및 Chrome/Edge/Firefox `hls.js` 연동
  - 직접 오디오 (MP3, AAC, OGG, Opus, WAV, Icecast): `HTMLAudioElement` 직접 재생 (CORS 차단 방지)
  - HTTP 혼합 콘텐츠 및 제한 스트림: Express 기반 `/api/stream-proxy` 자동 폴백 파이프라이닝
- **모바일 우선(Mobile-First) 반응형 디자인**:
  - 320px, 360px, 390px, 430px 스마트폰에서 잘림 및 가로 스크롤 없는 완벽한 레이아웃
  - 모바일 카테고리 접기/펼치기 그리드 서랍(Drawer) 제공
  - 40~44px 이상의 쾌적한 한 손 터치 타깃 확보
  - iOS Home Bar 및 상단 노치 대응 `env(safe-area-inset-*)` 안전 영역 지원
  - 동적 뷰포트(`100dvh`)로 주소창 확대/축소 시 덜컹거림 방지
- **중앙 오디오 플레이어**:
  - 하단 고정형 미니 플레이어 (Mini Player) & 터치 친화적 풀 플레이어 (Full Player)
  - 스마트폰 잠금 화면 및 블루투스/차량 제어를 지원하는 **Media Session API**
  - 앱 전환 및 백그라운드 복귀 시 상태를 동기화하는 **Page Visibility API**
  - 취침 예약 타이머 (15, 30, 45, 60, 90분)
- **카테고리 순서 사용자 지정**: 마우스 및 모바일 터치 위/아래 이동 버튼 지원, 기본 순서 복원 및 IndexedDB 영구 저장
- **Google Cast (Chromecast)**: Google Cast Web Sender SDK 공식 연동 (스마트 TV 및 무선 스피커 스트리밍)
- **가져오기 & 백업**: M3U/M3U8 플레이리스트 가져오기/내보내기 및 JSON 백업/복원
- **PWA 지원**: 홈 화면 앱 설치, 모바일 최적화 및 오프라인 캐싱
- **다국어 지원**: 한국어(기본), English, 日本語, 简体中文, 繁體中文
- **화면 테마**: 라이트 모드, 다크 모드, 시스템 기본값 지원

---

## 🛠️ 기술 스택

- **Frontend**: React 19, TypeScript
- **Bundler**: Vite 8
- **Full-Stack Server**: Express 4, `tsx`
- **Streaming Engine**: HTMLAudioElement, HLS.js, Media Session API
- **Styling**: Tailwind CSS v4, Material 3 감성 반응형 디자인
- **Casting**: Google Cast Web Sender SDK
- **Storage**: IndexedDB (localStorage 자동 폴백)
- **PWA**: vite-plugin-pwa (Web App Manifest, Service Worker)
- **Icons**: Lucide React

---

## 🚀 설치 및 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행 (Full-Stack)
```bash
npm run dev
```
개발 서버는 `http://localhost:3000`에서 실행되며, Express 백엔드와 Vite 개발 서버가 통합 구동됩니다.

### 3. 프로덕션 빌드
```bash
npm run build
```
빌드된 정적 파일은 `dist/` 폴더에 생성됩니다.

### 4. 프로덕션 서버 실행
```bash
npm start
```

---

## 📱 화면 크기별 반응형 지원

- **초소형/소형 스마트폰 (320px ~ 360px)**:
  - 1열 그리드 카드 및 간결한 미니 플레이어로 가로 넘침(Overflow) 방지
  - 상단바 검색 토글 버튼으로 헤더 버튼 겹침 제거
  - 팝업/모달 `max-h-[85dvh]` 및 내부 스크롤 적용으로 키보드 오픈 시에도 폼 조작 용이
- **일반 스마트폰 (390px ~ 430px)**:
  - 여유 있는 텍스트 줄바꿈 및 한 손 조작 터치 타깃 (44px)
  - 카테고리 접기/펼치기 토글로 10개 지역 및 사용자 카테고리를 한눈에 선택
- **태블릿 (768px)**:
  - 2열 그리드 및 확장된 플레이어 컨트롤, 상단 검색창 항시 노출
- **데스크톱 (1024px ~ 1440px+)**:
  - 3~4열 그리드, 미니 플레이어 내 볼륨 슬라이더 항시 제공, 키보드 단축키(Space, M, 화살표) 완벽 지원
