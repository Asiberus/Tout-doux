import moment from 'moment'

export function dateFormat(date: string, format: string) {
    return moment(date).format(format)
}
