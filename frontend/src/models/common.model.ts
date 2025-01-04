export interface Form<Data> {
  valid: boolean
  pending?: boolean
  data: Data
  rules?: Partial<Record<keyof Data, Array<(value: any) => boolean | string>>>
}

export interface UniqueResponse {
  unique: boolean
}

export interface ValidResponse {
  valid: boolean
}
