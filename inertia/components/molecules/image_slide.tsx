import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

interface Props {
  beforeImage: string
  afterImage: string
}

export default function ImageSlider({ beforeImage, afterImage }: Props) {
  const [sliderPosition, setSliderPosition] = useState<number>(50)

  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = (x / rect.width) * 100

    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }, [])

  function handleMouseDown() {
    isDraggingRef.current = true
  }

  function handleMouseUp() {
    isDraggingRef.current = false
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      updatePosition(e.clientX)
    },
    [updatePosition]
  )

  function handleTouchStart() {
    isDraggingRef.current = true
  }

  function handleTouchEnd() {
    isDraggingRef.current = false
  }

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDraggingRef.current) return
      updatePosition(e.touches[0].clientX)
    },
    [updatePosition]
  )

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchmove', handleTouchMove)

    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [handleMouseMove, handleTouchMove])

  /**
   * Keyboard equivalent of the drag, so the comparison is not mouse-and-thumb
   * only (WCAG 2.1.1). Arrow keys move the divider in 5% steps.
   */
  function handleKeyDown(event: ReactKeyboardEvent) {
    const step =
      event.key === 'ArrowLeft' || event.key === 'ArrowDown'
        ? -5
        : event.key === 'ArrowRight' || event.key === 'ArrowUp'
          ? 5
          : 0

    if (step === 0) return

    event.preventDefault()
    setSliderPosition((current) => Math.max(0, Math.min(100, current + step)))
  }

  return (
    /*
     * `touch-pan-y` hands vertical gestures back to the page. Without it the
     * handle sat in the middle of a tall page and swallowed the swipe: trying
     * to scroll past the comparison just dragged the divider, and the page
     * appeared stuck.
     */
    <div
      ref={containerRef}
      className="relative aspect-4/3 w-full touch-pan-y cursor-ew-resize overflow-hidden rounded-2xl select-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-label="Bandingkan foto sebelum dan sesudah"
      aria-valuenow={Math.round(sliderPosition)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* AFTER image (background) */}
      <div className="absolute inset-0">
        <img
          src={afterImage}
          alt="Sepatu setelah dibersihkan"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover grayscale"
        />
      </div>

      {/* BEFORE image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt="Sepatu sebelum dibersihkan"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover grayscale"
        />
      </div>

      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-xl">
          <div className="flex gap-1.5">
            <div className="h-5 w-0.5 bg-black" />
            <div className="h-5 w-0.5 bg-black" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 rounded bg-black px-3 py-1.5 text-xs tracking-wider text-white font-medium">
        Sebelum
      </div>
      <div className="absolute top-4 right-4 rounded bg-white px-3 py-1.5 text-xs tracking-wider text-black font-medium">
        Sesudah
      </div>
    </div>
  )
}
