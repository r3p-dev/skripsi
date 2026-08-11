import { formatDistance } from '@/lib/geocode'
import { useEffect, useRef } from 'react'

export type SuggestionItem = {
  latitude: number
  longitude: number
  label: string
  detail: string | null
}

type AddressSuggestionsProps = {
  heading: string | null
  items: SuggestionItem[]
  activeIndex: number
  onHighlight: (index: number) => void
  onPick: (item: SuggestionItem) => void
  onDismiss: () => void
}

export function toSuggestion(result: {
  latitude: number
  longitude: number
  label: string
}): SuggestionItem {
  return { ...result, detail: null }
}

export function toNearbySuggestion(place: {
  latitude: number
  longitude: number
  label: string
  category: string | null
  distance: number
}): SuggestionItem {
  return {
    latitude: place.latitude,
    longitude: place.longitude,
    label: place.label,
    detail: [place.category, formatDistance(place.distance)].filter(Boolean).join(' · '),
  }
}

export default function AddressSuggestions({
  heading,
  items,
  activeIndex,
  onHighlight,
  onPick,
  onDismiss,
}: AddressSuggestionsProps) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) {
        onDismiss()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)

    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [onDismiss])

  if (items.length === 0) {
    return null
  }

  return (
    <div
      ref={container}
      className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto border border-rule-field bg-white shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
    >
      {heading && (
        <div className="border-b border-rule bg-paper-tint px-4 py-2 text-eyebrow tracking-[0.14em] text-ink-subtle uppercase">
          {heading}
        </div>
      )}

      <ul id="address-suggestions" role="listbox" aria-label="Saran alamat">
        {items.map((item, index) => (
          <li key={`${item.latitude},${item.longitude},${index}`}>
            <button
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              id={`address-suggestion-${index}`}
              onPointerDown={(event) => event.preventDefault()}
              onMouseEnter={() => onHighlight(index)}
              onClick={() => onPick(item)}
              className={`block w-full border-b border-rule px-4 py-3 text-left last:border-b-0 ${
                index === activeIndex ? 'bg-paper-tint' : ''
              }`}
            >
              <span className="block text-meta leading-normal text-ink">{item.label}</span>
              {item.detail && (
                <span className="mt-0.5 block text-micro text-ink-subtle">{item.detail}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
