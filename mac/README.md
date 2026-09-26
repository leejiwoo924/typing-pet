# 타이핑펫 (macOS) — 배포

## Apple 계정 없이 실행 (권장)

`.app` / `.dmg` 를 직접 열면 *“damaged and can’t be opened”* 가 뜹니다.  
**파일 손상이 아니라** macOS가 미서명 앱을 막는 것입니다.

### 받는 사람
1. Actions Artifacts에서 **`TypingPet-*-Mac-열기.zip`** 만 받기
2. 압축 해제
3. **`★먼저-이것만-실행.command`** 실행  
   - 막히면: **우클릭 → 열기 → 열기**
4. Applications에 설치되며 자동 실행

이 스크립트가 quarantine을 제거하고 앱을 엽니다. **Apple Developer 계정 불필요.**

---

## Windows에서 빌드 받기

1. push 후 GitHub → **Actions** → **Build Mac** → **Run workflow**
2. Artifacts `typing-pet-mac-0.2.0` 다운로드
3. 공유할 파일: **`TypingPet-*-Mac-열기.zip`** (+ `사용설명서.txt`)

---

## (선택) Apple 서명+공증 — .app 더블클릭까지 허용

유료 Apple Developer + GitHub Secrets  
(`CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`)  
설정 후 Build Mac을 다시 돌리면, 그때는 `.app` 직접 실행도 가능합니다.

---

## 아키텍처

- **arm64** (Apple Silicon)
- 빌드는 GitHub `macos-latest` 에서만 (Windows에서 `--mac` 직접 빌드하지 않음)
