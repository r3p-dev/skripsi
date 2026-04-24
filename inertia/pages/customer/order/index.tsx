import { InertiaProps } from '@/types'
import { Data } from '@generated/data'

type PageProps = InertiaProps<{
  orders: {
    data: Data.Order[]
    metadata: {
      total: number
      currentPage: number
      lastPage: number
      firstPage: number
    }
  }
  filters: {
    search: string
    status: string
    page: number
  }
}>

export default function OrderList(props: PageProps) {
  console.log(props.orders)
  return <div>tes</div>
}
