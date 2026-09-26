import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  dialog,
  ipcMain,
  nativeImage,
  screen,
  shell,
} from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { uIOhook } from 'uiohook-napi'
import {
  ensurePetFolder,
  getPetDir,
  loadPetImages,
  replacePetImageFile,
  type PetImages,
  type PetSlot,
} from './petAssets'
import { loadSettings, saveSettings } from './settings'
import {
  addShortcutPose,
  getShortcutPoseImage,
  listShortcutPoseMeta,
  listShortcutPoses,
  pruneMissingShortcutPoses,
  removeShortcutPose,
  updateShortcutPose,
} from './shortcutPoses'
import {
  beginShortcutCapture,
  cancelShortcutCapture,
  handleShortcutKeyEvent,
  registerPoseShortcuts,
  setPoseShortcutHandler,
  unregisterAllShortcuts,
} from './shortcuts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const KEYDOWN_CHANNEL = 'typing-pet:keydown'
const IMAGES_CHANGED_CHANNEL = 'typing-pet:images-changed'
const FIXED_MODE_CHANNEL = 'typing-pet:fixed-mode'
const SHORTCUT_POSE_CHANNEL = 'typing-pet:shortcut-pose'

const WINDOW_WIDTH = 280
const WINDOW_HEIGHT = 280

let mainWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null
let tray: Tray | null = null
let petWatcher: fs.FSWatcher | null = null
let watchTimer: NodeJS.Timeout | null = null
let fixedMode = false

function getDefaultPosition() {
  const display = screen.getPrimaryDisplay().workArea
  return {
    x: display.x + display.width - WINDOW_WIDTH - 24,
    y: display.y + display.height - WINDOW_HEIGHT - 24,
  }
}

function applySavedPosition(win: BrowserWindow) {
  const settings = loadSettings()
  const fallback = getDefaultPosition()
  const x = settings.x ?? fallback.x
  const y = settings.y ?? fallback.y
  win.setPosition(Math.round(x), Math.round(y))
}

function persistWindowPosition(win: BrowserWindow) {
  const [x, y] = win.getPosition()
  saveSettings({ x, y })
}

function notifyFixedMode() {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(FIXED_MODE_CHANNEL, fixedMode)
    }
  }
}

function setFixedMode(enabled: boolean) {
  fixedMode = enabled
  saveSettings({ fixedMode: enabled })

  if (mainWindow && !mainWindow.isDestroyed()) {
    // 고정 모드: 클릭 통과 / 해제: 드래그로 위치 이동 가능
    mainWindow.setIgnoreMouseEvents(enabled)
  }

  notifyFixedMode()
  updateTrayMenu()
  console.log('[fixed-mode]', enabled ? 'on' : 'off')
}

function notifyShortcutPose(imageDataUrl: string | null) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(SHORTCUT_POSE_CHANNEL, imageDataUrl)
    }
  }
}

function triggerShortcutPose(poseId: string) {
  const imageDataUrl = getShortcutPoseImage(poseId)
  if (!imageDataUrl) {
    console.warn('[shortcuts] pose image missing:', poseId)
    return
  }
  console.log('[shortcuts] pose triggered:', poseId)
  notifyShortcutPose(imageDataUrl)
}

function setupPoseShortcuts() {
  pruneMissingShortcutPoses()
  setPoseShortcutHandler((poseId) => {
    triggerShortcutPose(poseId)
  })
  const result = registerPoseShortcuts()
  if (!result.ok) {
    console.warn('[shortcuts] failed to register:', result.failed.join(', '))
  } else {
    console.log('[shortcuts] registered', listShortcutPoseMeta().length, 'pose(s)')
  }
  return result
}

async function pickAndAddShortcutPose() {
  const parent =
    settingsWindow && !settingsWindow.isDestroyed()
      ? settingsWindow
      : mainWindow && !mainWindow.isDestroyed()
        ? mainWindow
        : undefined

  const options = {
    title: '단축키 이미지 추가',
    properties: ['openFile' as const],
    filters: [
      {
        name: 'Images',
        extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
      },
    ],
  }

  const result = parent
    ? await dialog.showOpenDialog(parent, options)
    : await dialog.showOpenDialog(options)

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  addShortcutPose(result.filePaths[0])
  setupPoseShortcuts()
  return listShortcutPoses()
}

function resolveAppIconPath() {
  const candidates = app.isPackaged
    ? [
        path.join(process.resourcesPath, 'app-icon', 'icon.png'),
        path.join(process.resourcesPath, 'app-icon', 'icon.ico'),
      ]
    : [
        path.join(process.cwd(), 'build', 'icon.png'),
        path.join(process.cwd(), 'build', 'icon.ico'),
      ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }

  // 아이콘 파일이 없으면 캐릭터 basic 이미지 사용
  const fallback = path.join(ensurePetFolder(), 'basic.png')
  return fs.existsSync(fallback) ? fallback : null
}

function createAppIcon(size = 16) {
  const iconPath = resolveAppIconPath()
  if (!iconPath) return nativeImage.createEmpty()
  return nativeImage.createFromPath(iconPath).resize({ width: size, height: size })
}

function createWindow() {
  const win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    icon: resolveAppIconPath() ?? undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow = win
  applySavedPosition(win)
  win.setIgnoreMouseEvents(fixedMode)

  win.on('moved', () => {
    if (!win.isDestroyed()) {
      persistWindowPosition(win)
    }
  })

  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.webContents.on('did-finish-load', () => {
    win.webContents.send(FIXED_MODE_CHANNEL, fixedMode)
  })
}

function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show()
    settingsWindow.focus()
    return
  }

  const win = new BrowserWindow({
    width: 460,
    height: 820,
    resizable: true,
    maximizable: false,
    minWidth: 420,
    minHeight: 640,
    title: '타이핑펫 설정',
    autoHideMenuBar: true,
    icon: resolveAppIconPath() ?? undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  settingsWindow = win

  win.on('closed', () => {
    if (settingsWindow === win) {
      settingsWindow = null
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(`${process.env.VITE_DEV_SERVER_URL}settings.html`)
  } else {
    win.loadFile(path.join(__dirname, '../dist/settings.html'))
  }

  win.webContents.on('did-finish-load', () => {
    win.webContents.send(FIXED_MODE_CHANNEL, fixedMode)
  })
}

function notifyRendererKeydown() {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(KEYDOWN_CHANNEL)
    }
  }
}

function notifyPetImagesChanged(images: PetImages) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IMAGES_CHANGED_CHANNEL, images)
    }
  }
}

function reloadPetImages() {
  const images = loadPetImages()
  notifyPetImagesChanged(images)
  return images
}

async function pickAndReplacePetImage(slot: PetSlot) {
  const parent =
    settingsWindow && !settingsWindow.isDestroyed()
      ? settingsWindow
      : mainWindow && !mainWindow.isDestroyed()
        ? mainWindow
        : undefined

  const options = {
    title:
      slot === 'basic'
        ? '대기 이미지 선택'
        : slot === 'right'
          ? '타이핑 자세(오른쪽) 선택'
          : '타이핑 자세(왼쪽) 선택',
    properties: ['openFile' as const],
    filters: [
      {
        name: 'Images',
        extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
      },
    ],
  }

  const result = parent
    ? await dialog.showOpenDialog(parent, options)
    : await dialog.showOpenDialog(options)

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const images = replacePetImageFile(slot, result.filePaths[0])
  notifyPetImagesChanged(images)
  return images
}

function openAccessibilitySettings() {
  // macOS Ventura+ 손쉬운 사용 설정 딥링크
  void shell.openExternal(
    'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
  )
}

function promptMacAccessibilityIfNeeded() {
  if (process.platform !== 'darwin') return

  const result = dialog.showMessageBoxSync({
    type: 'info',
    buttons: ['손쉬운 사용 열기', '나중에'],
    defaultId: 0,
    cancelId: 1,
    title: '타이핑펫',
    message: '손쉬운 사용 권한이 필요합니다',
    detail:
      '전역 타이핑에 반응하려면 시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용에서 타이핑펫을 허용한 뒤 앱을 다시 실행하세요.',
  })

  if (result === 0) {
    openAccessibilitySettings()
  }
}

function startGlobalKeyboard() {
  try {
    uIOhook.on('keydown', (event) => {
      // 단축키 캡처/발동 키는 타이핑 모션으로 넘기지 않음
      if (handleShortcutKeyEvent(event)) return
      notifyRendererKeydown()
    })

    uIOhook.start()
    console.log('[global-keyboard] started')
  } catch (error) {
    console.error('[global-keyboard] failed to start', error)
    promptMacAccessibilityIfNeeded()
  }
}

function stopGlobalKeyboard() {
  try {
    uIOhook.stop()
    console.log('[global-keyboard] stopped')
  } catch {
    // 이미 중지된 경우 무시
  }
}

function openPetFolder() {
  const petDir = ensurePetFolder()
  void shell.openPath(petDir)
}

function updateTrayMenu() {
  if (!tray) return

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: '설정 열기',
        click: () => openSettingsWindow(),
      },
      {
        label: '손쉬운 사용 설정 열기',
        click: () => openAccessibilitySettings(),
        visible: process.platform === 'darwin',
      },
      {
        label: fixedMode ? '고정 모드 끄기' : '고정 모드 켜기',
        click: () => setFixedMode(!fixedMode),
      },
      {
        label: '캐릭터 이미지 폴더 열기',
        click: () => openPetFolder(),
      },
      {
        label: '이미지 다시 불러오기',
        click: () => {
          try {
            reloadPetImages()
          } catch (error) {
            console.error('[pet-images] reload failed', error)
          }
        },
      },
      { type: 'separator' },
      {
        label: '종료',
        click: () => app.quit(),
      },
    ]),
  )
}

function createTray() {
  if (tray) {
    tray.destroy()
    tray = null
  }

  tray = new Tray(createAppIcon(16))
  tray.setToolTip('타이핑펫')
  tray.on('double-click', () => openSettingsWindow())
  updateTrayMenu()
}

function watchPetFolder() {
  const petDir = ensurePetFolder()

  if (petWatcher) {
    petWatcher.close()
    petWatcher = null
  }

  petWatcher = fs.watch(petDir, () => {
    if (watchTimer) {
      clearTimeout(watchTimer)
    }

    watchTimer = setTimeout(() => {
      try {
        reloadPetImages()
        console.log('[pet-images] reloaded')
      } catch (error) {
        console.error('[pet-images] reload failed', error)
      }
    }, 400)
  })
}

function registerIpc() {
  ipcMain.handle('typing-pet:get-images', () => loadPetImages())
  ipcMain.handle('typing-pet:open-pet-folder', () => {
    openPetFolder()
  })
  ipcMain.handle('typing-pet:get-pet-folder', () => ensurePetFolder())
  ipcMain.handle('typing-pet:reload-images', () => {
    return reloadPetImages()
  })
  ipcMain.handle('typing-pet:replace-image', async (_event, slot: PetSlot) => {
    if (slot !== 'basic' && slot !== 'right' && slot !== 'left') {
      throw new Error('Invalid pet image slot')
    }
    return pickAndReplacePetImage(slot)
  })
  ipcMain.handle('typing-pet:get-fixed-mode', () => fixedMode)
  ipcMain.handle('typing-pet:set-fixed-mode', (_event, enabled: boolean) => {
    setFixedMode(Boolean(enabled))
    return fixedMode
  })
  ipcMain.handle('typing-pet:get-shortcut-poses', () => listShortcutPoses())
  ipcMain.handle('typing-pet:add-shortcut-pose', async () => {
    return pickAndAddShortcutPose()
  })
  ipcMain.handle(
    'typing-pet:set-shortcut-pose-key',
    (_event, poseId: string, accelerator: string | null) => {
      if (typeof poseId !== 'string') {
        throw new Error('Invalid pose id')
      }
      updateShortcutPose(poseId, { accelerator: accelerator ?? '' })
      const result = setupPoseShortcuts()
      return {
        poses: listShortcutPoses(),
        ...result,
      }
    },
  )
  ipcMain.handle('typing-pet:capture-shortcut-key', () => beginShortcutCapture())
  ipcMain.handle('typing-pet:cancel-shortcut-capture', () => {
    cancelShortcutCapture()
  })
  ipcMain.handle('typing-pet:remove-shortcut-pose', (_event, poseId: string) => {
    const poses = removeShortcutPose(poseId)
    setupPoseShortcuts()
    return poses
  })
  ipcMain.handle('typing-pet:open-settings', () => {
    openSettingsWindow()
  })
  ipcMain.handle('typing-pet:quit', () => {
    app.quit()
  })
}

app.whenReady().then(() => {
  ensurePetFolder()
  fixedMode = loadSettings().fixedMode ?? false
  registerIpc()
  createWindow()
  createTray()
  watchPetFolder()
  startGlobalKeyboard()
  setupPoseShortcuts()

  if (process.platform === 'darwin' && !loadSettings().macAccessibilityHintShown) {
    saveSettings({ macAccessibilityHintShown: true })
    promptMacAccessibilityIfNeeded()
  }

  console.log('[pet-folder]', getPetDir())

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    persistWindowPosition(mainWindow)
  }
  unregisterAllShortcuts()
  stopGlobalKeyboard()
  if (petWatcher) {
    petWatcher.close()
    petWatcher = null
  }
  if (tray) {
    tray.destroy()
    tray = null
  }
})

app.on('window-all-closed', () => {
  // 오버레이/설정 창이 닫혀도 트레이에서 계속 동작
})
