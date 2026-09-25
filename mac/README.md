# 타이핑펫 (macOS) — 배포 전용

Windows에서 개발하고, **Mac 배포 파일(.dmg/.zip)만** 클라우드로 만드는 구성입니다.  
Mac 컴퓨터는 필요하지 않습니다. (빌드는 GitHub의 macOS 서버가 합니다.)

## Windows에서 배포 파일 받기

### 1) GitHub에 올리기
이 프로젝트(또는 `mac/` 포함 저장소)를 GitHub에 push 합니다.

### 2) Actions로 빌드
1. GitHub 저장소 → **Actions**
2. **Build Mac** 워크플로 선택
3. **Run workflow** 클릭
4. 완료 후 **Artifacts** 에서 `typing-pet-mac-0.2.0` 다운로드

포함 파일 예:
- `타이핑펫-0.2.0-mac.dmg`
- `타이핑펫-0.2.0-mac.zip`
- `사용설명서.txt`

### 3) 공유
다운로드한 폴더를 구글 드라이브 등에 올리면 됩니다.

> 서명/공증이 없으면 Mac에서 “확인되지 않은 개발자” 경고가 뜰 수 있습니다.  
> 받는 사람: 앱을 **우클릭 → 열기 → 열기**

## 받는 사람 (Mac) 설치

1. `.dmg` 열기 → 응용 프로그램으로 복사
2. **시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용** 에서 타이핑펫 허용
3. 앱 재실행

## (선택) Mac이 있을 때 로컬 빌드

```bash
cd mac
npm install
npm run dist:mac
```

## Apple 공증(선택)

Gatekeeper 경고 없이 배포하려면 Apple Developer 계정 + GitHub Secrets  
(`APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`) 설정 후  
[`.github/workflows/build-mac.yml`](../.github/workflows/build-mac.yml) 주석을 해제하세요.

## Windows 버전과의 관계

| | Windows (루트) | Mac (`mac/`) |
|--|--|--|
| 개발 PC | Windows | Windows에서 소스만 유지 |
| 배포물 | `.exe` | `.dmg` / `.zip` (Actions로 생성) |
| 전역 키보드 | uiohook | uiohook + 손쉬운 사용 권한 |
