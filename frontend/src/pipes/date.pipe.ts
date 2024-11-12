import moment from 'moment'

export function dateFormat(date: string, format: string): string {
  return moment(date).format(format)
}
