import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const productName = pkg.build?.productName ?? 'TypingPet'
const version = pkg.version
const outDir = path.join(root, '배포')

fs.mkdirSync(outDir, { recursive: true })

const releaseDir = path.join(root, 'release')
const patterns = [
  `${productName}-${version}-mac-arm64.dmg`,
  `${productName}-${version}-mac-arm64.zip`,
  `${productName}-${version}-mac.dmg`,
  `${productName}-${version}-mac.zip`,
]

let copied = 0
if (fs.existsSync(releaseDir)) {
  for (const name of patterns) {
    const src = path.join(releaseDir, name)
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(outDir, name))
      copied += 1
      console.log(` - ${name}`)
    }
  }
  if (copied === 0) {
    for (const name of fs.readdirSync(releaseDir)) {
      if (/\.(dmg|zip)$/i.test(name)) {
        fs.copyFileSync(path.join(releaseDir, name), path.join(outDir, name))
        copied += 1
        console.log(` - ${name}`)
      }
    }
  }
}

const helperSrc = path.join(root, 'scripts', '제거-quarantine-후-실행.command')
const helperDst = path.join(outDir, '제거-quarantine-후-실행.command')
if (fs.existsSync(helperSrc)) {
  fs.copyFileSync(helperSrc, helperDst)
  try {
    fs.chmodSync(helperDst, 0o755)
  } catch {
    // Windows에서 빌드 준비만 하는 경우 chmod 실패 가능
  }
  console.log(' - 제거-quarantine-후-실행.command')
}

const guide = `TypingPet (타이핑펫) Mac ${version}
========================

■ 설치 (권장: .dmg)
1. ${productName}-*-mac-arm64.dmg 를 엽니다.
2. 앱을 Applications(응용 프로그램) 폴더로 드래그합니다.
3. Applications에서 실행합니다.

■ “damaged and can’t be opened” 가 뜨는 경우
앱 파일이 깨진 것이 아닙니다.
GitHub 등에서 받은 unsigned 앱에 macOS quarantine(격리)이 붙어
Gatekeeper가 막는 증상입니다.

방법 A) 같은 폴더의 「제거-quarantine-후-실행.command」 더블클릭
방법 B) 터미널에서 (Applications에 설치한 뒤):
   xattr -cr /Applications/TypingPet.app
   open /Applications/TypingPet.app
방법 C) 앱 아이콘 우클릭 → 열기 → 열기
        (최신 macOS에서는 A/B가 더 확실합니다)

■ 손쉬운 사용 권한
시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용
에서 TypingPet / 타이핑펫을 허용한 뒤 앱을 다시 실행하세요.

■ 참고
- Apple Silicon (M1/M2/M3...) Mac용 arm64 빌드입니다.
- Windows용 .exe 와는 별개입니다.
- Developer ID 서명 + Apple 공증이 된 빌드는 위 경고 없이 바로 열립니다.
`

fs.writeFileSync(path.join(outDir, '사용설명서.txt'), guide, 'utf8')
console.log(`배포 폴더 준비: ${outDir}`)
console.log(' - 사용설명서.txt')
if (copied === 0) {
  console.log(' - (아직 dmg/zip 없음)')
}
