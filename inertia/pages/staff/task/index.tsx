type RoutePlanItem = {
  id: number
  orderNumber: string
  distanceKm: number
  label: 'Pickup' | 'Delivery'
}

export default function Tasks({
  unifiedRoutePlan,
  selectedDate,
}: {
  unifiedRoutePlan: RoutePlanItem[]
  selectedDate: string
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Rute Hari Ini</h1>
            <p className="text-sm text-muted-foreground">
              Urutan terdekat untuk penjemputan dan pengantaran tanggal {selectedDate}
            </p>
          </div>
          <form method="get" className="flex items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="rounded border px-3 py-2"
            />
            <button type="submit" className="rounded bg-primary px-3 py-2 text-sm text-white">
              Lihat
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Rute Gabungan</h2>
          <p className="text-sm text-muted-foreground">
            Daftar prioritas untuk pickup dan delivery agar satu perjalanan bisa menutup dua tugas.
          </p>
        </div>

        {unifiedRoutePlan.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tidak ada pesanan penjemputan atau pengantaran untuk tanggal ini.
          </p>
        ) : (
          <ol className="space-y-2">
            {unifiedRoutePlan.map((item, index) => (
              <li key={item.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="font-medium">
                    {index + 1}. {item.orderNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">Jarak: {item.distanceKm} km</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium">
                    {item.label}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs">
                    Prioritas {index + 1}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
