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

export type TypingPetApi = {
  version: string
  onKeyDown: (callback: () => void) => () => void
  getPetImages: () => Promise<PetImages>
  onPetImagesChanged: (callback: (images: PetImages) => void) => () => void
  openPetFolder: () => Promise<void>
  getPetFolderPath: () => Promise<string>
  reloadPetImages: () => Promise<PetImages>
  replacePetImage: (slot: 'basic' | 'right' | 'left') => Promise<PetImages | null>
  getFixedMode: () => Promise<boolean>
  setFixedMode: (enabled: boolean) => Promise<boolean>
  onFixedModeChanged: (callback: (enabled: boolean) => void) => () => void
  getShortcutPoses: () => Promise<ShortcutPose[]>
  addShortcutPose: () => Promise<ShortcutPose[] | null>
  setShortcutPoseKey: (
    poseId: string,
    accelerator: string | null,
  ) => Promise<{ poses: ShortcutPose[]; ok: boolean; failed: string[] }>
  captureShortcutKey: () => Promise<string | null>
  cancelShortcutCapture: () => Promise<void>
  removeShortcutPose: (poseId: string) => Promise<ShortcutPose[]>
  onShortcutPose: (callback: (imageDataUrl: string | null) => void) => () => void
  openSettings: () => Promise<void>
  quitApp: () => Promise<void>
}

declare global {
  interface Window {
    typingPet: TypingPetApi
  }
}

export {}
