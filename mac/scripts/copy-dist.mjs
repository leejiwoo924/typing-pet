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
  // fallback: copy any matching artifacts
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

■ 설치
1. TypingPet-*-mac-arm64.dmg 를 엽니다.
2. 앱을 Applications 폴더로 드래그합니다.
3. 실행합니다. (경고 시 우클릭 → 열기)

■ 손쉬운 사용 권한
시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용
에서 TypingPet / 타이핑펫을 허용한 뒤 앱을 다시 실행하세요.

■ 참고
- Apple Silicon (M1/M2/M3...) Mac용 빌드입니다.
- Windows용 .exe 와는 별개입니다.
`

fs.writeFileSync(path.join(outDir, '사용설명서.txt'), guide, 'utf8')
console.log(`배포 폴더 준비: ${outDir}`)
console.log(' - 사용설명서.txt')
if (copied === 0) {
  console.log(' - (아직 dmg/zip 없음)')
}
