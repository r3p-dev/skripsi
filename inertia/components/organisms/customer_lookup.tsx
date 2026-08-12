import { BoxInput, IconAction } from '@/components/atoms/editorial'
import { IconSearch, IconUserCheck, IconX } from '@tabler/icons-react'
import { useState } from 'react'

export type FoundCustomer = {
  id: number
  name: string
  phone: string
}

export function CustomerLookup({
  selected,
  onSelect,
  onClear,
}: {
  selected: FoundCustomer | null
  onSelect: (customer: FoundCustomer) => void
  onClear: () => void
}) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<FoundCustomer[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  async function search() {
    setSearching(true)

    try {
      const response = await fetch(`/staff/customers?search=${encodeURIComponent(term)}`, {
        headers: { Accept: 'application/json' },
      })
      const payload = (await response.json()) as { customers: FoundCustomer[] }

      setResults(payload.customers)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
      setSearched(true)
    }
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 border-l-2 border-ink bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <IconUserCheck className="size-4 shrink-0 text-ink" />
          <div>
            <p className="m-0 text-small leading-normal font-semibold text-ink">{selected.name}</p>
            <p className="m-0 text-meta leading-normal text-ink-soft">
              {selected.phone} · terhubung ke akun pelanggan
            </p>
          </div>
        </div>
        <IconAction onClick={onClear} aria-label="Lepaskan akun pelanggan" className="-my-1">
          <IconX className="size-4" />
        </IconAction>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2">
        <BoxInput
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Cari nama atau nomor telepon pelanggan..."
          aria-label="Cari pelanggan terdaftar"
          className="flex-1"
        />
        <button
          type="button"
          onClick={search}
          disabled={searching || term.trim().length < 3}
          className="flex min-h-11 shrink-0 items-center gap-2 border border-rule-field px-4 text-meta font-medium tracking-[0.04em] text-ink transition-colors hover:bg-paper-tint disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <IconSearch className="size-4" />
          Cari
        </button>
      </div>

      {searched && results.length === 0 && (
        <p className="m-0 text-meta leading-normal text-ink-subtle">
          Tidak ada akun yang cocok. Lanjutkan dengan mengisi data pelanggan secara manual.
        </p>
      )}

      {results.length > 0 && (
        <ul className="m-0 flex list-none flex-col border border-rule-field bg-white p-0">
          {results.map((customer) => (
            <li key={customer.id} className="border-b border-rule last:border-b-0">
              <button
                type="button"
                onClick={() => onSelect(customer)}
                className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-paper-tint"
              >
                <span className="text-small leading-normal font-medium text-ink">
                  {customer.name}
                </span>
                <span className="text-meta leading-normal text-ink-soft">{customer.phone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
