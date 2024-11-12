import {
  NavigationGuard,
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
} from 'vue-router'
import moment from 'moment/moment'

export const dailyUpdateGuard: NavigationGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  next: NavigationGuardNext
) => {
  const { date, step } = to.params
  if (moment().isSame(date, 'day')) next()
  else
    next({
      name: 'daily-update',
      params: { date: moment().format('YYYY-MM-DD'), step },
    })
}
