import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { ensurePetFolder, getPetDir } from './petAssets'
import { loadSettings, saveSettings } from './settings'

export type ShortcutPose = {
  id: string
  label: string
  accelerator: string
  imageDataUrl: string
}

export type ShortcutPoseMeta = {
  id: string
  label: string
  accelerator: string
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

function toDataUrl(filePath: string) {
  const buffer = fs.readFileSync(filePath)
  return `data:${sniffImageMime(buffer)};base64,${buffer.toString('base64')}`
}

export function getCustomPoseDir() {
  const dir = path.join(getPetDir(), 'shortcuts')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function poseImagePath(id: string) {
  return path.join(getCustomPoseDir(), `${id}.png`)
}

export function listShortcutPoseMeta(): ShortcutPoseMeta[] {
  ensurePetFolder()
  const saved = loadSettings().shortcutPoses ?? []
  return saved
    .filter((pose) => fs.existsSync(poseImagePath(pose.id)))
    .map((pose) => ({
      id: pose.id,
      label: pose.label,
      accelerator: pose.accelerator,
    }))
}

/** 이미지가 사라진 단축키 항목을 settings에서 제거 */
export function pruneMissingShortcutPoses() {
  const current = loadSettings().shortcutPoses ?? []
  const next = current.filter((pose) => fs.existsSync(poseImagePath(pose.id)))
  if (next.length !== current.length) {
    saveSettings({ shortcutPoses: next })
  }
  return next.length
}

export function listShortcutPoses(): ShortcutPose[] {
  ensurePetFolder()
  const saved = loadSettings().shortcutPoses ?? []
  const poses: ShortcutPose[] = []

  for (const pose of saved) {
    const imagePath = poseImagePath(pose.id)
    if (!fs.existsSync(imagePath)) continue
    poses.push({
      id: pose.id,
      label: pose.label,
      accelerator: pose.accelerator,
      imageDataUrl: toDataUrl(imagePath),
    })
  }

  return poses
}

export function addShortcutPose(sourcePath: string, label?: string): ShortcutPose {
  ensurePetFolder()
  const id = randomUUID()
  const targetPath = poseImagePath(id)
  fs.copyFileSync(sourcePath, targetPath)

  const baseName = path.basename(sourcePath, path.extname(sourcePath))
  const poseMeta = {
    id,
    label: label?.trim() || baseName || '새 이미지',
    accelerator: '',
  }

  const current = loadSettings().shortcutPoses ?? []
  saveSettings({ shortcutPoses: [...current, poseMeta] })

  return {
    ...poseMeta,
    imageDataUrl: toDataUrl(targetPath),
  }
}

export function updateShortcutPose(
  id: string,
  patch: { label?: string; accelerator?: string },
) {
  const current = loadSettings().shortcutPoses ?? []
  const next = current.map((pose) => {
    if (pose.id !== id) return pose
    return {
      ...pose,
      label: patch.label ?? pose.label,
      accelerator:
        patch.accelerator === undefined ? pose.accelerator : patch.accelerator,
    }
  })
  saveSettings({ shortcutPoses: next })
  return listShortcutPoses()
}

export function removeShortcutPose(id: string) {
  const current = loadSettings().shortcutPoses ?? []
  saveSettings({
    shortcutPoses: current.filter((pose) => pose.id !== id),
  })

  const imagePath = poseImagePath(id)
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath)
  }

  return listShortcutPoses()
}

export function getShortcutPoseImage(id: string) {
  const imagePath = poseImagePath(id)
  if (!fs.existsSync(imagePath)) return null
  return toDataUrl(imagePath)
}
