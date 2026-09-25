import { useEffect, useRef, useState } from 'react'
import Character from './components/Character'
import './App.css'

const TYPING_IDLE_MS = 250
/** 단축키 이미지 표시 시간 (새 이미지 디코딩 여유 포함) */
const SHORTCUT_POSE_MS = 500

function App() {
  const [isTyping, setIsTyping] = useState(false)
  const [fixedMode, setFixedMode] = useState(false)
  const [shortcutPose, setShortcutPose] = useState<string | null>(null)
  const idleTimerRef = useRef<number | null>(null)
  const shortcutTimerRef = useRef<number | null>(null)
  const shortcutActiveRef = useRef(false)
  const shortcutTokenRef = useRef(0)

  useEffect(() => {
    if (!window.typingPet?.onKeyDown) {
      console.warn('[typing-pet] preload bridge missing')
      return
    }

    const unsubscribe = window.typingPet.onKeyDown(() => {
      // 단축키 이미지 표시 중에는 타이핑 모션으로 덮어쓰지 않음
      if (shortcutActiveRef.current) return

      setIsTyping(true)

      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current)
      }

      idleTimerRef.current = window.setTimeout(() => {
        setIsTyping(false)
        idleTimerRef.current = null
      }, TYPING_IDLE_MS)
    })

    return () => {
      unsubscribe()
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!window.typingPet?.getFixedMode) return

    void window.typingPet.getFixedMode().then(setFixedMode)
    return window.typingPet.onFixedModeChanged(setFixedMode)
  }, [])

  useEffect(() => {
    if (!window.typingPet?.onShortcutPose) return

    return window.typingPet.onShortcutPose((imageDataUrl) => {
      shortcutTokenRef.current += 1
      const token = shortcutTokenRef.current

      if (shortcutTimerRef.current !== null) {
        window.clearTimeout(shortcutTimerRef.current)
        shortcutTimerRef.current = null
      }

      if (!imageDataUrl) {
        shortcutActiveRef.current = false
        setShortcutPose(null)
        return
      }

      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
      setIsTyping(false)

      const showPose = () => {
        if (token !== shortcutTokenRef.current) return
        shortcutActiveRef.current = true
        setShortcutPose(imageDataUrl)
        shortcutTimerRef.current = window.setTimeout(() => {
          if (token !== shortcutTokenRef.current) return
          shortcutActiveRef.current = false
          setShortcutPose(null)
          shortcutTimerRef.current = null
        }, SHORTCUT_POSE_MS)
      }

      // data URL 디코딩이 끝나기 전에 타이머가 돌지 않도록 대기
      const preloader = new Image()
      preloader.onload = showPose
      preloader.onerror = showPose
      preloader.src = imageDataUrl
    })
  }, [])

  useEffect(() => {
    return () => {
      if (shortcutTimerRef.current !== null) {
        window.clearTimeout(shortcutTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="overlay">
      <Character
        isTyping={isTyping}
        fixedMode={fixedMode}
        shortcutPose={shortcutPose}
      />
    </div>
  )
}

export default App
