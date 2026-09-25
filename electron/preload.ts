import { contextBridge, ipcRenderer } from 'electron'

const KEYDOWN_CHANNEL = 'typing-pet:keydown'
const IMAGES_CHANGED_CHANNEL = 'typing-pet:images-changed'
const FIXED_MODE_CHANNEL = 'typing-pet:fixed-mode'
const SHORTCUT_POSE_CHANNEL = 'typing-pet:shortcut-pose'

export type PetImages = {
  basic: string
  right: string
  left: string
}

export type ShortcutPose = {
  id: string
  label: string
  accelerator: string
  imageDataUrl: string
}

contextBridge.exposeInMainWorld('typingPet', {
  version: '0.3.0',
  onKeyDown: (callback: () => void) => {
    const listener = () => {
      callback()
    }

    ipcRenderer.on(KEYDOWN_CHANNEL, listener)

    return () => {
      ipcRenderer.removeListener(KEYDOWN_CHANNEL, listener)
    }
  },
  getPetImages: (): Promise<PetImages> => {
    return ipcRenderer.invoke('typing-pet:get-images')
  },
  onPetImagesChanged: (callback: (images: PetImages) => void) => {
    const listener = (_event: unknown, images: PetImages) => {
      callback(images)
    }

    ipcRenderer.on(IMAGES_CHANGED_CHANNEL, listener)

    return () => {
      ipcRenderer.removeListener(IMAGES_CHANGED_CHANNEL, listener)
    }
  },
  openPetFolder: (): Promise<void> => {
    return ipcRenderer.invoke('typing-pet:open-pet-folder')
  },
  getPetFolderPath: (): Promise<string> => {
    return ipcRenderer.invoke('typing-pet:get-pet-folder')
  },
  reloadPetImages: (): Promise<PetImages> => {
    return ipcRenderer.invoke('typing-pet:reload-images')
  },
  replacePetImage: (
    slot: 'basic' | 'right' | 'left',
  ): Promise<PetImages | null> => {
    return ipcRenderer.invoke('typing-pet:replace-image', slot)
  },
  getFixedMode: (): Promise<boolean> => {
    return ipcRenderer.invoke('typing-pet:get-fixed-mode')
  },
  setFixedMode: (enabled: boolean): Promise<boolean> => {
    return ipcRenderer.invoke('typing-pet:set-fixed-mode', enabled)
  },
  onFixedModeChanged: (callback: (enabled: boolean) => void) => {
    const listener = (_event: unknown, enabled: boolean) => {
      callback(enabled)
    }

    ipcRenderer.on(FIXED_MODE_CHANNEL, listener)

    return () => {
      ipcRenderer.removeListener(FIXED_MODE_CHANNEL, listener)
    }
  },
  getShortcutPoses: (): Promise<ShortcutPose[]> => {
    return ipcRenderer.invoke('typing-pet:get-shortcut-poses')
  },
  addShortcutPose: (): Promise<ShortcutPose[] | null> => {
    return ipcRenderer.invoke('typing-pet:add-shortcut-pose')
  },
  setShortcutPoseKey: (
    poseId: string,
    accelerator: string | null,
  ): Promise<{ poses: ShortcutPose[]; ok: boolean; failed: string[] }> => {
    return ipcRenderer.invoke(
      'typing-pet:set-shortcut-pose-key',
      poseId,
      accelerator,
    )
  },
  captureShortcutKey: (): Promise<string | null> => {
    return ipcRenderer.invoke('typing-pet:capture-shortcut-key')
  },
  cancelShortcutCapture: (): Promise<void> => {
    return ipcRenderer.invoke('typing-pet:cancel-shortcut-capture')
  },
  removeShortcutPose: (poseId: string): Promise<ShortcutPose[]> => {
    return ipcRenderer.invoke('typing-pet:remove-shortcut-pose', poseId)
  },
  onShortcutPose: (callback: (imageDataUrl: string | null) => void) => {
    const listener = (_event: unknown, imageDataUrl: string | null) => {
      callback(imageDataUrl)
    }

    ipcRenderer.on(SHORTCUT_POSE_CHANNEL, listener)

    return () => {
      ipcRenderer.removeListener(SHORTCUT_POSE_CHANNEL, listener)
    }
  },
  openSettings: (): Promise<void> => {
    return ipcRenderer.invoke('typing-pet:open-settings')
  },
  quitApp: (): Promise<void> => {
    return ipcRenderer.invoke('typing-pet:quit')
  },
})
