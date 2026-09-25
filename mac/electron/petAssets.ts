import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

export type PetImages = {
  basic: string
  right: string
  left: string
}

export type PetSlot = 'basic' | 'right' | 'left'

const PET_FILES = ['basic.png', 'right.png', 'left.png'] as const

export function getPetDir() {
  if (app.isPackaged) {
    // 사용자 교체용 폴더 (앱 재설치와 무관하게 유지)
    return path.join(app.getPath('userData'), 'pet')
  }

  return path.join(process.cwd(), 'pet-user')
}

function getDefaultsDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'pet-defaults')
  }

  return path.join(process.cwd(), 'src', 'assets', 'pet')
}

function ensureGuide(petDir: string) {
  const guidePath = path.join(petDir, '읽어주세요.txt')
  if (fs.existsSync(guidePath)) return

  const guide = `타이핑펫 캐릭터 이미지 폴더

이 폴더의 PNG 파일을 원하는 그림으로 바꿔 넣으세요.

- basic.png  : 타이핑하지 않을 때
- right.png  : 타이핑할 때 자세 1
- left.png   : 타이핑할 때 자세 2

파일을 저장하면 잠시 후 자동으로 화면에 반영됩니다.
파일 이름은 꼭 위와 같아야 합니다.
`

  fs.writeFileSync(guidePath, guide, 'utf8')
}

export function ensurePetFolder() {
  const petDir = getPetDir()
  const defaultsDir = getDefaultsDir()

  fs.mkdirSync(petDir, { recursive: true })

  for (const fileName of PET_FILES) {
    const target = path.join(petDir, fileName)
    if (fs.existsSync(target)) continue

    const source = path.join(defaultsDir, fileName)
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, target)
    }
  }

  ensureGuide(petDir)
  return petDir
}

function toDataUrl(filePath: string) {
  const buffer = fs.readFileSync(filePath)
  const mime = sniffImageMime(buffer)
  return `data:${mime};base64,${buffer.toString('base64')}`
}

function sniffImageMime(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png'
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp'
  }
  return 'image/png'
}

export function replacePetImageFile(slot: PetSlot, sourcePath: string) {
  const petDir = ensurePetFolder()
  const targetPath = path.join(petDir, `${slot}.png`)
  fs.copyFileSync(sourcePath, targetPath)
  return loadPetImages()
}

export function loadPetImages(): PetImages {
  const petDir = ensurePetFolder()
  const defaultsDir = getDefaultsDir()

  const readOne = (fileName: (typeof PET_FILES)[number]) => {
    const customPath = path.join(petDir, fileName)
    if (fs.existsSync(customPath)) {
      return toDataUrl(customPath)
    }

    const defaultPath = path.join(defaultsDir, fileName)
    if (fs.existsSync(defaultPath)) {
      return toDataUrl(defaultPath)
    }

    throw new Error(`Missing pet image: ${fileName}`)
  }

  return {
    basic: readOne('basic.png'),
    right: readOne('right.png'),
    left: readOne('left.png'),
  }
}
