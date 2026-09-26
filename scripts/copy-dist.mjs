import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const productName = pkg.build?.productName ?? '타이핑펫'
const version = pkg.version
const exeName = `${productName}-${version}-portable.exe`
const releaseExe = path.join(root, 'release', exeName)
const outDir = path.join(root, '배포')

if (!fs.existsSync(releaseExe)) {
  console.error(`배포 파일을 찾을 수 없습니다: ${releaseExe}`)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })
fs.copyFileSync(releaseExe, path.join(outDir, exeName))

const guide = `타이핑펫 ${version} 사용 설명서
========================

■ 실행 방법
1. ${exeName} 를 원하는 폴더에 복사합니다.
2. 더블클릭으로 실행합니다. (설치 과정 없음)
3. 화면 위 캐릭터가 나타나고, 키보드를 치면 반응합니다.

■ 트레이 아이콘
- 작업 표시줄 오른쪽(트레이)에서 타이핑펫 아이콘을 클릭/우클릭합니다.
- 설정: 이미지·단축키·고정 모드 변경
- 종료: 프로그램 종료

■ 캐릭터 위치
- 기본: 캐릭터를 마우스로 드래그해 위치를 옮길 수 있습니다.
- 설정에서 "고정 모드"를 켜면 클릭이 통과되어 아래 창을 조작할 수 있습니다.

■ 이미지 변경
- 설정 창에서 basic / right / left 이미지를 교체할 수 있습니다.
- PNG(투명) / GIF(애니메이션) 가능. 투명 배경을 사용하면 자연스럽습니다.

■ 단축키 이미지
- 설정에서 원하는 키 조합과 이미지를 추가하면,
  해당 단축키를 눌렀을 때 잠시 그 이미지가 표시됩니다.

■ 참고
- Windows 보안 경고가 뜨면 "추가 정보" → "실행"을 선택하세요.
  (코드 서명이 없는 portable 실행 파일입니다.)
- 다른 PC로 옮길 때는 .exe 파일만 복사하면 됩니다.
- 사용자 설정·이미지는 각 PC의 AppData에 저장됩니다.
`

fs.writeFileSync(path.join(outDir, '사용설명서.txt'), guide, 'utf8')
console.log(`배포 폴더 준비 완료: ${outDir}`)
console.log(` - ${exeName}`)
console.log(' - 사용설명서.txt')
