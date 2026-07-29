import { NavigationGuard } from 'vue-router'
import moment from 'moment/moment'

export const dailyUpdateGuard: NavigationGuard = to => {
  const { date, step } = to.params
  if (!moment().isSame(date, 'day'))
    return { name: 'daily-update', params: { date: moment().format('YYYY-MM-DD'), step } }
  return undefined
}
