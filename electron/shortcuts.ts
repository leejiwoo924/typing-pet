import {
  UiohookKey,
  type UiohookKeyboardEvent,
} from 'uiohook-napi'
import { listShortcutPoseMeta } from './shortcutPoses'

type PoseShortcutHandler = (poseId: string) => void

type Binding = {
  poseId: string
  label: string
  accelerator: string
  keycode: number
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
}

const MODIFIER_KEYCODES = new Set<number>([
  UiohookKey.Ctrl,
  UiohookKey.CtrlRight,
  UiohookKey.Alt,
  UiohookKey.AltRight,
  UiohookKey.Shift,
  UiohookKey.ShiftRight,
  UiohookKey.Meta,
  UiohookKey.MetaRight,
  UiohookKey.CapsLock,
  UiohookKey.NumLock,
  UiohookKey.ScrollLock,
])

const KEYCODE_BY_NAME: Record<string, number> = {
  Space: UiohookKey.Space,
  Enter: UiohookKey.Enter,
  Tab: UiohookKey.Tab,
  Esc: UiohookKey.Escape,
  Escape: UiohookKey.Escape,
  Backspace: UiohookKey.Backspace,
  Delete: UiohookKey.Delete,
  Up: UiohookKey.ArrowUp,
  Down: UiohookKey.ArrowDown,
  Left: UiohookKey.ArrowLeft,
  Right: UiohookKey.ArrowRight,
  Home: UiohookKey.Home,
  End: UiohookKey.End,
  PageUp: UiohookKey.PageUp,
  PageDown: UiohookKey.PageDown,
  Insert: UiohookKey.Insert,
  '-': UiohookKey.Minus,
  '=': UiohookKey.Equal,
  '[': UiohookKey.BracketLeft,
  ']': UiohookKey.BracketRight,
  ';': UiohookKey.Semicolon,
  "'": UiohookKey.Quote,
  ',': UiohookKey.Comma,
  '.': UiohookKey.Period,
  '/': UiohookKey.Slash,
  '\\': UiohookKey.Backslash,
  '`': UiohookKey.Backquote,
  num0: UiohookKey.Numpad0,
  num1: UiohookKey.Numpad1,
  num2: UiohookKey.Numpad2,
  num3: UiohookKey.Numpad3,
  num4: UiohookKey.Numpad4,
  num5: UiohookKey.Numpad5,
  num6: UiohookKey.Numpad6,
  num7: UiohookKey.Numpad7,
  num8: UiohookKey.Numpad8,
  num9: UiohookKey.Numpad9,
  numMultiply: UiohookKey.NumpadMultiply,
  numAdd: UiohookKey.NumpadAdd,
  numSubtract: UiohookKey.NumpadSubtract,
  numDecimal: UiohookKey.NumpadDecimal,
  numDivide: UiohookKey.NumpadDivide,
  numEnter: UiohookKey.NumpadEnter,
}

const NAME_BY_KEYCODE = new Map<number, string>()
for (const [name, code] of Object.entries(KEYCODE_BY_NAME)) {
  if (!NAME_BY_KEYCODE.has(code)) NAME_BY_KEYCODE.set(code, name)
}
for (let i = 0; i < 26; i += 1) {
  const letter = String.fromCharCode(65 + i)
  const code = UiohookKey[letter as keyof typeof UiohookKey] as number
  NAME_BY_KEYCODE.set(code, letter)
  KEYCODE_BY_NAME[letter] = code
}
for (let i = 0; i <= 9; i += 1) {
  const digit = String(i)
  const code = UiohookKey[digit as keyof typeof UiohookKey] as number
  NAME_BY_KEYCODE.set(code, digit)
  KEYCODE_BY_NAME[digit] = code
}
for (let i = 1; i <= 24; i += 1) {
  const name = `F${i}`
  const code = UiohookKey[name as keyof typeof UiohookKey] as number | undefined
  if (typeof code === 'number') {
    NAME_BY_KEYCODE.set(code, name)
    KEYCODE_BY_NAME[name] = code
  }
}

let onPoseShortcut: PoseShortcutHandler | null = null
let bindings: Binding[] = []
let captureResolve: ((accelerator: string | null) => void) | null = null
let captureTimer: NodeJS.Timeout | null = null

export function setPoseShortcutHandler(handler: PoseShortcutHandler) {
  onPoseShortcut = handler
}

function resolveKeycode(key: string): number | null {
  if (KEYCODE_BY_NAME[key] != null) return KEYCODE_BY_NAME[key]
  if (KEYCODE_BY_NAME[key.toUpperCase()] != null) {
    return KEYCODE_BY_NAME[key.toUpperCase()]
  }
  return null
}

function parseAccelerator(accelerator: string): Omit<
  Binding,
  'poseId' | 'label' | 'accelerator'
> | null {
  const parts = accelerator
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return null

  let ctrl = false
  let alt = false
  let shift = false
  let meta = false
  let key: string | null = null

  for (const part of parts) {
    const lower = part.toLowerCase()
    if (
      lower === 'control' ||
      lower === 'ctrl' ||
      lower === 'cmdorctrl' ||
      lower === 'commandorcontrol'
    ) {
      ctrl = true
    } else if (lower === 'alt' || lower === 'option') {
      alt = true
    } else if (lower === 'shift') {
      shift = true
    } else if (
      lower === 'super' ||
      lower === 'meta' ||
      lower === 'command' ||
      lower === 'cmd'
    ) {
      meta = true
    } else {
      key = part
    }
  }

  if (!key) return null
  const keycode = resolveKeycode(key)
  if (keycode == null) return null

  return { keycode, ctrl, alt, shift, meta }
}

function eventToAccelerator(event: UiohookKeyboardEvent): string | null {
  if (MODIFIER_KEYCODES.has(event.keycode)) return null

  const key = NAME_BY_KEYCODE.get(event.keycode)
  if (!key) return null

  const parts: string[] = []
  if (event.ctrlKey) parts.push('Control')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  if (event.metaKey) parts.push('Super')
  parts.push(key)
  return parts.join('+')
}

export function registerPoseShortcuts() {
  const failed: string[] = []
  const next: Binding[] = []

  for (const pose of listShortcutPoseMeta()) {
    const accelerator = pose.accelerator.trim()
    if (!accelerator) continue

    const parsed = parseAccelerator(accelerator)
    if (!parsed) {
      failed.push(`${pose.label} (${accelerator})`)
      continue
    }

    next.push({
      poseId: pose.id,
      label: pose.label,
      accelerator,
      ...parsed,
    })
  }

  bindings = next
  return { ok: failed.length === 0, failed }
}

export function unregisterAllShortcuts() {
  bindings = []
  cancelShortcutCapture()
}

export function cancelShortcutCapture() {
  if (captureTimer) {
    clearTimeout(captureTimer)
    captureTimer = null
  }
  if (captureResolve) {
    const resolve = captureResolve
    captureResolve = null
    resolve(null)
  }
}

export function beginShortcutCapture(timeoutMs = 20000): Promise<string | null> {
  cancelShortcutCapture()

  return new Promise((resolve) => {
    captureResolve = resolve
    captureTimer = setTimeout(() => {
      captureTimer = null
      if (captureResolve === resolve) {
        captureResolve = null
        resolve(null)
      }
    }, timeoutMs)
  })
}

/** Returns true if the key was consumed as shortcut capture or pose trigger. */
export function handleShortcutKeyEvent(event: UiohookKeyboardEvent): boolean {
  if (MODIFIER_KEYCODES.has(event.keycode)) return false

  if (captureResolve) {
    if (event.keycode === UiohookKey.Escape) {
      cancelShortcutCapture()
      return true
    }

    const accelerator = eventToAccelerator(event)
    if (!accelerator) return false

    if (captureTimer) {
      clearTimeout(captureTimer)
      captureTimer = null
    }
    const resolve = captureResolve
    captureResolve = null
    resolve(accelerator)
    return true
  }

  for (const binding of bindings) {
    if (
      binding.keycode === event.keycode &&
      binding.ctrl === event.ctrlKey &&
      binding.alt === event.altKey &&
      binding.shift === event.shiftKey &&
      binding.meta === event.metaKey
    ) {
      onPoseShortcut?.(binding.poseId)
      return true
    }
  }

  return false
}
