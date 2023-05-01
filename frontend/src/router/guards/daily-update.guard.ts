import { NavigationGuard, NavigationGuardNext, Route } from 'vue-router/types/router'
import moment from 'moment/moment'

export const dailyUpdateGuard: NavigationGuard = (
    to: Route,
    from: Route,
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
