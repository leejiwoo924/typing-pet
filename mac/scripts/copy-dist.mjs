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

const guide = `TypingPet (타이핑펫) Mac ${version}
========================

■ “위험한 다운로드” 경고
Chrome/Safari가 미서명 Mac 앱을 위험하다고 표시할 수 있습니다.
파일 손상이 아닙니다. 다운로드에서 “유지/Keep” 을 선택하세요.

★ Apple 계정 없이 실행 (권장)
1. 「${productName}-${version}-Mac-열기.zip」 받기 → 유지
2. 압축 해제
3. 터미널에서 (폴더를 Downloads에 푼 경우):

   cd ~/Downloads/${productName}-Mac-열기
   xattr -cr .
   cp -R TypingPet.app /Applications/
   xattr -cr /Applications/TypingPet.app
   open /Applications/TypingPet.app

   또는 「★먼저-이것만-실행.command」 우클릭 → 열기

※ TypingPet.app / .dmg 앱을 직접 더블클릭하지 마세요.
   “damaged and can’t be opened” 가 뜹니다.

■ 손쉬운 사용 권한
시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용
에서 TypingPet 을 허용한 뒤 다시 실행하세요.

■ 참고
- Apple Silicon (M1/M2/M3...) Mac용 arm64 빌드입니다.
- Windows용 .exe 와는 별개입니다.
- 경고 없이 더블클릭만으로 열려면 Apple Developer 서명+공증이 필요합니다.
`

fs.writeFileSync(path.join(outDir, '사용설명서.txt'), guide, 'utf8')
console.log(`배포 폴더 준비: ${outDir}`)
console.log(' - 사용설명서.txt')
if (copied === 0) {
  console.log(' - (아직 dmg/zip 없음)')
}
