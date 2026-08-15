export interface Pagination<Data> {
  count: number
  page: number
  size: number
  first: boolean
  last: boolean
  content: Data
}

export interface PaginationParams {
  page?: number
  size?: number
}
