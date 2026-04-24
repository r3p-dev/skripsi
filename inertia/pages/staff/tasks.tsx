import { Button } from '@/components/ui/button'
import { IconPackage, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'

const CURRENT_STAFF_ID = 'STAFF001'

interface Task {
  id: string
  type: 'pickup' | 'delivery' | 'inspection'
  orderId: string
  customerName: string
  address: string
  time: string
  status: 'pending' | 'claimed' | 'in_progress' | 'completed'
  claimedBy?: string
}

const initialTasks: Task[] = [
  {
    id: 'T001',
    type: 'pickup',
    orderId: 'ORD20240305001',
    customerName: 'Budi Santoso',
    address: 'Jl. Dipatiukur No. 35, Bandung',
    time: '09:00 - 10:00',
    status: 'pending',
  },
  {
    id: 'T002',
    type: 'inspection',
    orderId: 'ORD20240305002',
    customerName: 'Siti Nurhaliza',
    address: 'Jl. Setiabudi No. 120, Bandung',
    time: '10:00 - 11:00',
    status: 'claimed',
    claimedBy: CURRENT_STAFF_ID,
  },
  {
    id: 'T003',
    type: 'delivery',
    orderId: 'ORD20240305003',
    customerName: 'Ahmad Rifai',
    address: 'Jl. Cihampelas No. 45, Bandung',
    time: '11:00 - 12:00',
    status: 'pending',
  },
  {
    id: 'T004',
    type: 'pickup',
    orderId: 'ORD20240305004',
    customerName: 'Dewi Lestari',
    address: 'Jl. Dago No. 88, Bandung',
    time: '13:00 - 14:00',
    status: 'in_progress',
    claimedBy: CURRENT_STAFF_ID,
  },
  {
    id: 'T005',
    type: 'delivery',
    orderId: 'ORD20240305005',
    customerName: 'Rizky Pratama',
    address: 'Jl. Pasteur No. 25, Bandung',
    time: '14:00 - 15:00',
    status: 'pending',
  },
]

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')

  const todayDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const todayTasks = tasks.filter((task) => task.status !== 'completed')
  const myTasks = todayTasks.filter((task) => task.claimedBy === CURRENT_STAFF_ID)
  const availableTasks = todayTasks.filter((task) => task.status === 'pending')

  const handleClaimTask = (taskId: string) => {
    setSelectedTaskId(taskId)
    setClaimDialogOpen(true)
  }

  const handleConfirmClaim = async (): Promise<{ success: boolean; message: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const isAlreadyClaimed = Math.random() < 0.2

    if (isAlreadyClaimed) {
      return {
        success: false,
        message: 'Tugas ini sudah diklaim oleh staff lain. Silakan pilih tugas lain.',
      }
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === selectedTaskId
          ? { ...task, status: 'claimed' as const, claimedBy: CURRENT_STAFF_ID }
          : task
      )
    )

    return {
      success: true,
      message: 'Tugas berhasil diklaim! Anda dapat memulai tugas ini.',
    }
  }

  const handleCancelTask = (taskId: string) => {
    setSelectedTaskId(taskId)
    setCancelDialogOpen(true)
  }

  const handleConfirmCancel = (reason: string) => {
    console.log('Canceling task:', selectedTaskId, 'Reason:', reason)
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === selectedTaskId
          ? { ...task, status: 'pending' as const, claimedBy: undefined }
          : task
      )
    )
    setCancelDialogOpen(false)
  }

  const handleStartTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    if (task.type === 'pickup' || task.type === 'delivery') {
    } else if (task.type === 'inspection') {
    }
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-3xl mb-2 tracking-tight">Tugas Hari Ini</h2>
            <p className="text-sm text-muted-foreground">{todayDate}</p>
          </div>
          <Button size="sm" className="bg-black hover:bg-black/90 rounded-full gap-2 h-9 text-sm">
            <IconPlus className="size-4" />
            Order Offline
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-secondary/30 border border-border/50 rounded-2xl p-4 text-center">
            <p className="text-2xl tracking-tight mb-1">{todayTasks.length}</p>
            <p className="text-xs text-muted-foreground">Total Tugas</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
            <p className="text-2xl tracking-tight mb-1 text-blue-900">{myTasks.length}</p>
            <p className="text-xs text-blue-700">Tugas Saya</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-2xl tracking-tight mb-1 text-green-900">{availableTasks.length}</p>
            <p className="text-xs text-green-700">Tersedia</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {availableTasks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm tracking-wide text-muted-foreground">TUGAS TERSEDIA</h3>
            {availableTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClaim={handleClaimTask}
                onCancel={handleCancelTask}
                onStart={handleStartTask}
                currentStaffId={CURRENT_STAFF_ID}
              />
            ))}
          </div>
        )}

        {todayTasks.length === 0 && (
          <div className="text-center py-12">
            <IconPackage className="size-16 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground mt-4 text-sm">Tidak ada tugas hari ini</p>
          </div>
        )}
      </div>

      <ClaimTaskDialog
        open={claimDialogOpen}
        onOpenChange={setClaimDialogOpen}
        onConfirm={handleConfirmClaim}
        taskId={selectedTaskId}
      />

      <CancelTaskDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleConfirmCancel}
        taskId={selectedTaskId}
      />
    </div>
  )
}
