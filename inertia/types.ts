import { type Data } from '@/generated/data'
import { type PropsWithChildren } from 'react'
import { type JSONDataTypes } from '@adonisjs/core/types/transformers'

export type InertiaProps<T extends JSONDataTypes = {}> = PropsWithChildren<Data.SharedProps & T>
export type Metadata = {
  total: number
  currentPage: number
  lastPage: number
  firstPage: number
}
export type Filters = {
  search: string
  page: number
}
