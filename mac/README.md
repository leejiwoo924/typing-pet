# 타이핑펫 (macOS) — 배포

Windows에서 개발하고, **Mac 배포 파일(.dmg/.zip)** 은 GitHub Actions(macOS runner)로 만듭니다.

## “damaged and can’t be opened” 원인

앱이 실제로 깨진 경우가 거의 아닙니다.

현재 CI 기본값은 **코드 서명 없음(unsigned)** 입니다. GitHub에서 받은 파일에는 macOS **quarantine** 속성이 붙고, Gatekeeper가 unsigned 앱을 **손상된 것처럼** 막습니다.

| 구분 | 내용 |
|--|--|
| 실제 손상 | 드묾 (다운로드 깨짐 등) |
| 실제 원인 | unsigned + quarantine + Gatekeeper |
| 근본 해결 | Developer ID 서명 + Apple 공증(notarize) |
| 임시 해결 | `xattr -cr` 또는 배포물 안 `제거-quarantine-후-실행.command` |

개발용 `npm run dev` 는 로컬 실행이라 quarantine이 없어 이 오류가 안 납니다. **배포용 빌드만** 해당됩니다.

## Windows에서 배포 파일 받기

1. 저장소 push
2. GitHub → **Actions** → **Build Mac** → **Run workflow**
3. Artifacts `typing-pet-mac-0.2.0` 다운로드  
   - `TypingPet-*-mac-arm64.dmg` (권장)  
   - `TypingPet-*-mac-arm64.zip`  
   - `사용설명서.txt`  
   - `제거-quarantine-후-실행.command` (unsigned일 때)

## 받는 Mac 사용자 (서명 없는 빌드)

1. `.dmg` 열기 → Applications로 복사  
2. “damaged” 뜨면 `제거-quarantine-후-실행.command` 실행, 또는:
   ```bash
   xattr -cr /Applications/TypingPet.app
   open /Applications/TypingPet.app
   ```
3. **시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용** 에서 허용

## 사용자가 직접 해야 하는 것 (Apple 계정) — 더블클릭 정상 실행

프로젝트/CI만으로는 Apple 인증서를 만들 수 없습니다. 아래는 **본인 Apple Developer 계정**에서만 가능합니다.

### 1) Apple Developer Program 등록
- https://developer.apple.com (연 유료 멤버십)

### 2) Developer ID Application 인증서
1. Mac에서 Keychain Access 또는 developer.apple.com Certificates  
2. **Developer ID Application** 인증서 발급  
3. `.p12` 로보내기 → Base64 인코딩  
   ```bash
   base64 -i DeveloperID.p12 | pbcopy
   ```

### 3) 공증용 계정 정보 (둘 중 하나)
**A. Apple ID + 앱 암호**
- Apple ID
- [앱 전용 암호](https://appleid.apple.com) (App-Specific Password)
- Team ID (developer.apple.com → Membership)

**B. App Store Connect API Key**
- Issuer ID, Key ID, `.p8` 키

### 4) GitHub Secrets 등록
Repo → **Settings → Secrets and variables → Actions**

| Secret | 설명 |
|--|--|
| `CSC_LINK` | Developer ID `.p12` 의 Base64 |
| `CSC_KEY_PASSWORD` | `.p12` 비밀번호 |
| `APPLE_ID` | Apple ID (방식 A) |
| `APPLE_APP_SPECIFIC_PASSWORD` | 앱 전용 암호 (방식 A) |
| `APPLE_TEAM_ID` | 10자 Team ID (방식 A) |
| `APPLE_API_KEY` / `APPLE_API_KEY_ID` / `APPLE_API_ISSUER` | 방식 B |

Secrets를 넣은 뒤 **Build Mac**을 다시 실행하면 서명+공증된 dmg가 나옵니다. 그때는 quarantine 제거 없이 더블클릭으로 열립니다.

## 이 저장소가 자동으로 하는 것

- `mac/package.json`: hardenedRuntime, entitlements, afterSign 공증 훅
- `mac/scripts/notarize.cjs`: 자격 증명 있을 때만 공증
- `.github/workflows/build-mac.yml`: Secrets 있으면 서명, 없으면 unsigned + 경고
- 배포 폴더에 quarantine 해제 도우미 포함

## 아키텍처

- **arm64 only** (Apple Silicon). Intel Mac용이 필요하면 `universal` 또는 `x64` 타깃을 추가해야 합니다.
- Windows PC에서 `electron-builder --mac` 로 .app을 직접 만드는 방식은 **사용하지 않습니다**. (네이티브 모듈·서명 문제로 실패하거나 깨지기 쉬움)  
  Mac 패키지는 항상 **GitHub `macos-latest` runner** 에서 빌드합니다.

## 로컬 Mac이 있을 때

```bash
cd mac
npm install
npm run dist:mac
```

서명하려면 같은 환경변수/`CSC_LINK`를 설정하세요.
