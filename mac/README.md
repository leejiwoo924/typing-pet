# 타이핑펫 (macOS) — 배포

## Apple 계정 없이 실행 (권장)

`.app` / `.dmg` 를 직접 열면 *“damaged and can’t be opened”* 가 뜹니다.  
Chrome이 *“위험한 다운로드”* 라고 해도 **미서명 앱 경고**인 경우가 많습니다. → **유지/Keep**

### 받는 사람
1. **`TypingPet-*-Mac-열기.zip`** 다운로드 → 위험 경고 시 **유지**
2. 압축 해제
3. **터미널** (확실):
   ```bash
   cd ~/Downloads/TypingPet-Mac-열기
   xattr -cr .
   cp -R TypingPet.app /Applications/
   xattr -cr /Applications/TypingPet.app
   open /Applications/TypingPet.app
   ```
   또는 **`★먼저-이것만-실행.command`** → 우클릭 → 열기

**Apple Developer 계정 불필요.** 경고를 완전히 없애려면 서명+공증만 가능합니다.

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
