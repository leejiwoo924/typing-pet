import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { PetImages, ShortcutPose } from './vite-env'
import './settings.css'

const IMAGE_SLOTS = [
  {
    key: 'basic',
    title: 'basic (대기)',
    help: '타이핑하지 않을 때',
  },
  {
    key: 'right',
    title: 'right (타이핑 1)',
    help: '타이핑할 때 자세 1',
  },
  {
    key: 'left',
    title: 'left (타이핑 2)',
    help: '타이핑할 때 자세 2',
  },
] as const

function SettingsApp() {
  const [images, setImages] = useState<PetImages | null>(null)
  const [fixedMode, setFixedMode] = useState(false)
  const [shortcutPoses, setShortcutPoses] = useState<ShortcutPose[]>([])
  const [message, setMessage] = useState('')
  const [busySlot, setBusySlot] = useState<string | null>(null)
  const [recordingId, setRecordingId] = useState<string | null>(null)

  const showMessage = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2500)
  }

  useEffect(() => {
    if (!window.typingPet) return

    void window.typingPet.getPetImages().then(setImages)
    void window.typingPet.getFixedMode().then(setFixedMode)
    void window.typingPet.getShortcutPoses().then(setShortcutPoses)

    const offImages = window.typingPet.onPetImagesChanged(setImages)
    const offFixed = window.typingPet.onFixedModeChanged(setFixedMode)

    return () => {
      offImages()
      offFixed()
    }
  }, [])

  useEffect(() => {
    if (!recordingId) return

    let cancelled = false

    void window.typingPet.captureShortcutKey().then((accelerator) => {
      if (cancelled) return

      if (!accelerator) {
        setRecordingId(null)
        showMessage('단축키 설정을 취소했습니다.')
        return
      }

      void window.typingPet
        .setShortcutPoseKey(recordingId, accelerator)
        .then((result) => {
          if (cancelled) return
          setShortcutPoses(result.poses)
          setRecordingId(null)
          if (!result.ok) {
            showMessage(`등록 실패: ${result.failed.join(', ')}`)
          } else {
            showMessage(`단축키 저장: ${accelerator}`)
          }
        })
    })

    return () => {
      cancelled = true
      void window.typingPet.cancelShortcutCapture()
    }
  }, [recordingId])

  const changeImage = async (slot: 'basic' | 'right' | 'left') => {
    setBusySlot(slot)
    try {
      const next = await window.typingPet.replacePetImage(slot)
      if (next) {
        setImages(next)
        showMessage(`${slot} 이미지를 바꿨습니다.`)
      }
    } finally {
      setBusySlot(null)
    }
  }

  return (
    <div className="settings">
      <header className="settings__header">
        <div className="settings__header-row">
          <h1>타이핑펫 설정</h1>
          <span className="settings__watermark">@miya_heaboja</span>
        </div>
        <p>기본 이미지와 단축키 이미지를 여기서 관리합니다.</p>
      </header>

      <section className="settings__card">
        <h2>기본 캐릭터 이미지</h2>
        <p className="settings__help">
          대기/타이핑에 쓰는 기본 이미지입니다.
        </p>
        <p className="settings__size-hint">
          권장 크기: <strong>800×500</strong> 또는 <strong>512×512</strong> ·
          PNG(투명) / GIF(애니메이션) 가능 · 화면에는 200×200 안에 비율 유지로
          표시됩니다.
        </p>

        <div className="settings__image-grid">
          {IMAGE_SLOTS.map((slot) => (
            <div key={slot.key} className="settings__image-item">
              <div className="settings__preview">
                {images ? (
                  <img src={images[slot.key]} alt={slot.title} />
                ) : (
                  <span>로딩...</span>
                )}
              </div>
              <div className="settings__image-meta">
                <strong>{slot.title}</strong>
                <span>{slot.help}</span>
                <button
                  type="button"
                  disabled={busySlot === slot.key}
                  onClick={() => void changeImage(slot.key)}
                >
                  {busySlot === slot.key ? '선택 중...' : '이미지 바꾸기'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="settings__card">
        <h2>단축키 이미지</h2>
        <p className="settings__help">
          이미지를 추가한 뒤 단축키를 지정하세요. 단축키를 누르면 캐릭터가 그
          이미지로 잠시 바뀝니다.
        </p>
        <p className="settings__size-hint">
          권장 크기: 기본 캐릭터와 동일 (<strong>800×500</strong> 또는{' '}
          <strong>512×512</strong>) · PNG / GIF 가능
        </p>

        <div className="settings__actions">
          <button
            type="button"
            onClick={() => {
              void window.typingPet.addShortcutPose().then((poses) => {
                if (poses) {
                  setShortcutPoses(poses)
                  showMessage('이미지를 추가했습니다. 단축키를 지정하세요.')
                }
              })
            }}
          >
            이미지 추가
          </button>
        </div>

        <div className="settings__shortcut-list">
          {shortcutPoses.length === 0 && (
            <p className="settings__help">아직 추가된 단축키 이미지가 없습니다.</p>
          )}

          {shortcutPoses.map((pose) => (
            <div key={pose.id} className="settings__image-item">
              <div className="settings__preview">
                <img src={pose.imageDataUrl} alt={pose.label} />
              </div>
              <div className="settings__image-meta">
                <strong>{pose.label}</strong>
                <code>
                  {recordingId === pose.id
                    ? '키를 누르세요...'
                    : pose.accelerator || '단축키 없음'}
                </code>
                <div className="settings__shortcut-actions">
                  <button
                    type="button"
                    className="button--secondary"
                    onClick={() => setRecordingId(pose.id)}
                  >
                    단축키 지정
                  </button>
                  <button
                    type="button"
                    className="button--secondary"
                    disabled={!pose.accelerator}
                    onClick={() => {
                      void window.typingPet
                        .setShortcutPoseKey(pose.id, null)
                        .then((result) => {
                          setShortcutPoses(result.poses)
                          showMessage('단축키를 해제했습니다.')
                        })
                    }}
                  >
                    해제
                  </button>
                  <button
                    type="button"
                    className="button--secondary"
                    onClick={() => {
                      void window.typingPet
                        .removeShortcutPose(pose.id)
                        .then((poses) => {
                          setShortcutPoses(poses)
                          showMessage('이미지를 삭제했습니다.')
                        })
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="settings__card">
        <h2>위치</h2>
        <p className="settings__help">
          기본은 캐릭터를 드래그해서 언제든 위치를 옮길 수 있습니다. 고정
          모드를 켜면 위치가 잠기고, 뒤쪽 화면을 클릭할 수 있습니다.
        </p>
        <label className="settings__toggle">
          <input
            type="checkbox"
            checked={fixedMode}
            onChange={(event) => {
              void window.typingPet.setFixedMode(event.target.checked)
            }}
          />
          <span>고정 모드</span>
        </label>
      </section>

      <section className="settings__card settings__card--danger">
        <button
          type="button"
          className="button--danger"
          onClick={() => void window.typingPet.quitApp()}
        >
          타이핑펫 종료
        </button>
      </section>

      {message && <div className="settings__toast">{message}</div>}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsApp />
  </StrictMode>,
)
