import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const productName = pkg.build?.productName ?? '타이핑펫'
const version = pkg.version
const outDir = path.join(root, '배포')

fs.mkdirSync(outDir, { recursive: true })

const releaseDir = path.join(root, 'release')
const wanted = [
  `${productName}-${version}-mac.dmg`,
  `${productName}-${version}-mac.zip`,
]

let copied = 0
if (fs.existsSync(releaseDir)) {
  for (const name of wanted) {
    const src = path.join(releaseDir, name)
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(outDir, name))
      copied += 1
      console.log(` - ${name}`)
    }
  }
}

const guide = `타이핑펫 Mac ${version} 사용 설명서
========================

■ 설치
1. ${productName}-${version}-mac.dmg 를 엽니다.
2. 타이핑펫을 Applications(응용 프로그램) 폴더로 드래그합니다.
3. 앱을 실행합니다.

■ 꼭 필요한 권한 (손쉬운 사용)
macOS는 전역 키보드 감지를 기본으로 막습니다.
처음 실행 후 아래를 허용해야 타이핑에 반응합니다.

1. 시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용
2. 타이핑펫을 켠 상태로 추가/허용
3. 앱을 한 번 종료했다가 다시 실행

■ 사용
- 트레이(메뉴 막대) 아이콘에서 설정·종료
- 설정에서 이미지·단축키·고정 모드 변경
- 워터마크: @miya_heaboja

■ 참고
- 이 빌드는 Mac용입니다. Windows .exe 와는 별개입니다.
- Apple 공증(Notarize)을 하지 않은 빌드는
  "확인되지 않은 개발자" 경고가 뜰 수 있습니다.
  그 경우: 우클릭 → 열기 → 열기
- 공증까지 하려면 Apple Developer 계정과
  환경변수(APPLE_ID 등) 설정 후 다시 빌드하세요.
`

fs.writeFileSync(path.join(outDir, '사용설명서.txt'), guide, 'utf8')
console.log(`배포 폴더 준비: ${outDir}`)
console.log(' - 사용설명서.txt')
if (copied === 0) {
  console.log(' - (아직 dmg/zip 없음) Mac에서 npm run dist:mac 실행 후 다시 시도')
}
