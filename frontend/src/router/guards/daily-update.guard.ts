import { NavigationGuard } from 'vue-router'
import moment from 'moment/moment'
import { MAX_PLANNING_HORIZON_DAYS } from '@/utils/constants'

export const dailyUpdateGuard: NavigationGuard = to => {
  const { date, step } = to.params
  const today = moment().startOf('day')
  // Parsing strict : toute comparaison portant sur un moment invalide rend `false`, une date
  // illisible franchirait donc le guard sans ce contrôle.
  const target = moment(date as string, 'YYYY-MM-DD', true)

  const isPlannable =
    target.isValid() &&
    !target.isBefore(today) &&
    target.diff(today, 'days') <= MAX_PLANNING_HORIZON_DAYS

  if (!isPlannable)
    return { name: 'daily-update', params: { date: today.format('YYYY-MM-DD'), step } }

  return undefined
}
