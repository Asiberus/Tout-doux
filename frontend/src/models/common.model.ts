export interface PaginationParams {
    page?: number
    size?: number
}

export interface Form<Data> {
    valid: boolean
    pending?: boolean
    data: Data
    rules?: Partial<Record<keyof Data, Array<(value: any) => boolean | string>>>
}
