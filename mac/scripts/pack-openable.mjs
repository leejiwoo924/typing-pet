/**
 * Apple 계정 없이 배포 가능한 「열기용 ZIP」 생성.
 * ZIP 안에 ★먼저-이것만-실행.command + TypingPet.app + 안내문.
 * 사용자는 .app 이 아니라 command 를 실행하면 quarantine 이 제거됩니다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, execSync } from 'node:child_process'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const productName = pkg.build?.productName ?? 'TypingPet'
const version = pkg.version
const releaseDir = path.join(root, 'release')
const outDir = path.join(root, '배포')
const stageName = `${productName}-Mac-열기`
const stageDir = path.join(outDir, stageName)
const zipName = `${productName}-${version}-Mac-열기.zip`
const zipPath = path.join(outDir, zipName)

function findAppZip() {
  const preferred = path.join(
    releaseDir,
    `${productName}-${version}-mac-arm64.zip`,
  )
  if (fs.existsSync(preferred)) return preferred
  if (!fs.existsSync(releaseDir)) return null
  const hit = fs
    .readdirSync(releaseDir)
    .find((n) => n.endsWith('.zip') && n.includes('mac'))
  return hit ? path.join(releaseDir, hit) : null
}

function findAppInDir(dir) {
  const direct = path.join(dir, `${productName}.app`)
  if (fs.existsSync(direct)) return direct
  const alt = path.join(dir, '타이핑펫.app')
  if (fs.existsSync(alt)) return alt
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (name.endsWith('.app') && fs.statSync(full).isDirectory()) return full
    if (fs.statSync(full).isDirectory() && !name.startsWith('.')) {
      const nested = findAppInDir(full)
      if (nested) return nested
    }
  }
  return null
}

const appZip = findAppZip()
if (!appZip) {
  console.error('[pack-openable] release/*.zip (mac) 없음 — electron-builder zip 빌드 후 실행하세요.')
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })
fs.rmSync(stageDir, { recursive: true, force: true })
fs.mkdirSync(stageDir, { recursive: true })

const extractDir = path.join(outDir, '_extract-app')
fs.rmSync(extractDir, { recursive: true, force: true })
fs.mkdirSync(extractDir, { recursive: true })

if (process.platform === 'darwin') {
  execFileSync('ditto', ['-x', '-k', appZip, extractDir], { stdio: 'inherit' })
} else {
  execFileSync('tar', ['-xf', appZip, '-C', extractDir], { stdio: 'inherit' })
}

const appPath = findAppInDir(extractDir)
if (!appPath) {
  console.error('[pack-openable] ZIP 안에서 .app 을 찾지 못했습니다.')
  process.exit(1)
}

const destApp = path.join(stageDir, path.basename(appPath))
if (process.platform === 'darwin') {
  execFileSync('ditto', [appPath, destApp], { stdio: 'inherit' })
} else {
  fs.cpSync(appPath, destApp, { recursive: true })
}

const cmdSrc = path.join(root, 'scripts', '★먼저-이것만-실행.command')
const cmdDst = path.join(stageDir, '★먼저-이것만-실행.command')
fs.copyFileSync(cmdSrc, cmdDst)
try {
  fs.chmodSync(cmdDst, 0o755)
} catch {
  /* ignore on Windows */
}

const readme = `TypingPet Mac ${version} — Apple 계정 없이 실행
========================================

※ TypingPet.app 을 직접 더블클릭하지 마세요.
   (“damaged and can’t be opened” 가 뜹니다.)

■ 설치 / 실행 (이 방법만 사용)
1. 이 ZIP 을 압축 해제합니다.
2. 「★먼저-이것만-실행.command」 를 실행합니다.
   - 막히면: 우클릭 → 열기 → 열기
   - 또는 터미널에 파일을 끌어다 놓고 Enter
3. Applications 에 설치되고 자동 실행됩니다.

■ 손쉬운 사용
시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용
에서 TypingPet 허용 후 다시 실행하세요.

■ 참고
Apple Silicon (M1/M2/M3...) 용입니다.
`
fs.writeFileSync(path.join(stageDir, '읽어주세요.txt'), readme, 'utf8')

fs.rmSync(zipPath, { force: true })
if (process.platform === 'darwin') {
  execSync(`ditto -c -k --sequesterRsrc --keepParent ${JSON.stringify(stageName)} ${JSON.stringify(zipName)}`, {
    cwd: outDir,
    stdio: 'inherit',
  })
} else {
  // Windows에서 미리 만들어 둘 때 (CI는 macOS)
  execSync(`tar -a -cf ${JSON.stringify(zipName)} ${JSON.stringify(stageName)}`, {
    cwd: outDir,
    stdio: 'inherit',
  })
}

fs.rmSync(extractDir, { recursive: true, force: true })
// stage 폴더는 배포물에 남겨 두어도 되고, zip만 남겨도 됨 — zip + 안내 유지
console.log(`[pack-openable] 생성: ${zipPath}`)
console.log('[pack-openable] 사용자에게 이 ZIP 만 공유하세요. .app / dmg 직접 열기 금지.')
