import { useEffect, useRef, useState, useCallback } from 'react'

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

  return (
    <div
      ref={containerRef}
      className="relative aspect-4/3 w-full cursor-ew-resize overflow-hidden rounded-2xl select-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      role="slider"
      aria-valuenow={sliderPosition}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* AFTER image (background) */}
      <div className="absolute inset-0">
        <img src={afterImage} alt="Sesudah" className="h-full w-full object-cover grayscale" />
      </div>

      {/* BEFORE image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img src={beforeImage} alt="Sebelum" className="h-full w-full object-cover grayscale" />
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
