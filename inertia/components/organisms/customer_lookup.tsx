import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconSearch, IconUserCheck, IconX } from '@tabler/icons-react'
import { useState } from 'react'

export type FoundCustomer = {
  id: number
  name: string
  phone: string
}

/**
 * Finds a walk-in customer who has used the app before.
 *
 * Someone who books online and then one day carries their shoes in themselves
 * is the same person, but retyping their details at the counter creates a
 * second one: an order their own history will never show, and a customer
 * record that quietly forks in two. Picking the account instead binds the
 * order to it — which is also what makes counter delivery possible at all,
 * since the address it would go to is the one on the account.
 *
 * Deliberately opt-in. Most people who walk in have never used the app, and
 * making staff dismiss a search box for every one of them would be worse than
 * the problem it solves.
 */
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
      <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <IconUserCheck className="size-4 shrink-0 text-green-700" />
          <div>
            <p className="text-sm font-semibold text-green-900">{selected.name}</p>
            <p className="text-xs text-green-800">{selected.phone} · terhubung ke akun pelanggan</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Lepaskan akun pelanggan"
          className="-my-2 flex size-11 shrink-0 items-center justify-center rounded-full text-green-800 transition-colors hover:bg-green-100"
        >
          <IconX className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Cari nama atau nomor telepon pelanggan..."
          aria-label="Cari pelanggan terdaftar"
          className="h-11 flex-1 rounded-xl bg-white"
        />
        <Button
          type="button"
          variant="outline"
          onClick={search}
          disabled={searching || term.trim().length < 3}
          className="h-11 rounded-xl px-4"
        >
          <IconSearch className="size-4" />
          Cari
        </Button>
      </div>

      {searched && results.length === 0 && (
        <p className="text-xs text-gray-500">
          Tidak ada akun yang cocok. Lanjutkan dengan mengisi data pelanggan secara manual.
        </p>
      )}

      {results.length > 0 && (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-300 bg-white">
          {results.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                onClick={() => onSelect(customer)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-black">{customer.name}</span>
                <span className="text-xs text-gray-600">{customer.phone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
