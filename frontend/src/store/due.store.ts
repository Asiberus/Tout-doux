import { taskApi } from '@/api'
import { DueContainerSummary, DueSummary } from '@/models/task.model'
import moment from 'moment'
import { defineStore } from 'pinia'

const STALE_AFTER_MS = 60_000

let inFlight: { date: string; request: Promise<void> } | null = null

interface DueStoreState {
  summary: DueSummary | null
  date: string | null
  loadedAt: number | null
}

interface DueStoreGetters extends Record<string, (state: DueStoreState) => unknown> {
  toPlanCount(state: DueStoreState): number
  hasLate(state: DueStoreState): boolean
  containerDue(
    state: DueStoreState
  ): (type: DueContainerSummary['type'], id: number) => { count: number; late: boolean }
}

interface DueStoreActions {
  refresh(options?: { force?: boolean }): Promise<void>
  reset(): void
}

export const useDueStore = defineStore<'due', DueStoreState, DueStoreGetters, DueStoreActions>(
  'due',
  {
    state: (): DueStoreState => ({
      summary: null,
      date: null,
      loadedAt: null,
    }),
    getters: {
      toPlanCount(state): number {
        return state.summary ? state.summary.late + state.summary.today : 0
      },
      hasLate(state): boolean {
        return !!state.summary && state.summary.late > 0
      },
      containerDue(state) {
        return (type, id): { count: number; late: boolean } => {
          const container = state.summary?.containers.find(
            summary => summary.type === type && summary.id === id
          )
          if (!container) return { count: 0, late: false }
          return { count: container.late + container.today, late: container.late > 0 }
        }
      },
    },
    actions: {
      refresh({ force = false } = {}): Promise<void> {
        const date = moment().format('YYYY-MM-DD')
        if (inFlight?.date === date) return inFlight.request

        const fresh = this.loadedAt !== null && Date.now() - this.loadedAt < STALE_AFTER_MS
        if (!force && date === this.date && fresh) return Promise.resolve()

        const request = taskApi
          .getDueSummary(date)
          .then(summary => {
            this.summary = summary
            this.date = date
            this.loadedAt = Date.now()
          })
          .catch(error => console.error(error))
          .finally(() => (inFlight = null))
        inFlight = { date, request }
        return request
      },

      reset(): void {
        this.summary = null
        this.date = null
        this.loadedAt = null
      },
    },
  }
)
