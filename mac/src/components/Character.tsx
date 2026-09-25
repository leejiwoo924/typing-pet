import { useEffect, useState } from 'react'
import type { PetImages } from '../vite-env'

const TYPING_POSE_MS = 100

type CharacterProps = {
  isTyping: boolean
  fixedMode: boolean
  shortcutPose: string | null
}

function Character({ isTyping, fixedMode, shortcutPose }: CharacterProps) {
  const [images, setImages] = useState<PetImages | null>(null)
  const [typingIndex, setTypingIndex] = useState(0)

  useEffect(() => {
    if (!window.typingPet?.getPetImages) return

    void window.typingPet.getPetImages().then(setImages)
    return window.typingPet.onPetImagesChanged(setImages)
  }, [])

  useEffect(() => {
    if (!isTyping || !images || shortcutPose) return

    setTypingIndex(Math.floor(Math.random() * 2))

    const timer = window.setInterval(() => {
      setTypingIndex((current) => (current + 1) % 2)
    }, TYPING_POSE_MS)

    return () => window.clearInterval(timer)
  }, [isTyping, images, shortcutPose])

  if (!images) return null

  const typingPoses = [images.right, images.left]
  const src = shortcutPose
    ? shortcutPose
    : isTyping
      ? typingPoses[typingIndex]
      : images.basic

  return (
    <img
      className={`pet${isTyping && !shortcutPose ? ' pet--typing' : ''}${fixedMode ? '' : ' pet--draggable'}`}
      src={src}
      alt=""
      draggable={false}
    />
  )
}

export default Character
