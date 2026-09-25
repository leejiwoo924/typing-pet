import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

export type ShortcutPoseSettings = {
  id: string
  label: string
  accelerator: string
}

export type AppSettings = {
  x?: number
  y?: number
  fixedMode?: boolean
  shortcutPoses?: ShortcutPoseSettings[]
  macAccessibilityHintShown?: boolean
}

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

export function loadSettings(): AppSettings {
  const settingsPath = getSettingsPath()
  if (!fs.existsSync(settingsPath)) return {}

  try {
    const raw = fs.readFileSync(settingsPath, 'utf8')
    const parsed = JSON.parse(raw) as AppSettings
    return {
      x: typeof parsed.x === 'number' ? parsed.x : undefined,
      y: typeof parsed.y === 'number' ? parsed.y : undefined,
      fixedMode:
        typeof parsed.fixedMode === 'boolean' ? parsed.fixedMode : undefined,
      shortcutPoses: Array.isArray(parsed.shortcutPoses)
        ? parsed.shortcutPoses.filter(
            (pose) =>
              pose &&
              typeof pose.id === 'string' &&
              typeof pose.label === 'string' &&
              typeof pose.accelerator === 'string',
          )
        : undefined,
      macAccessibilityHintShown:
        typeof parsed.macAccessibilityHintShown === 'boolean'
          ? parsed.macAccessibilityHintShown
          : undefined,
    }
  } catch {
    return {}
  }
}

export function saveSettings(patch: AppSettings) {
  const settingsPath = getSettingsPath()
  const next = { ...loadSettings(), ...patch }
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
  fs.writeFileSync(settingsPath, JSON.stringify(next, null, 2), 'utf8')
}
