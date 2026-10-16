import moment, { Moment } from 'moment'
import { computed, ComputedRef, ref } from 'vue'

// Précision minute : nécessaire pour `isPassed`, qui compare à la minute près un événement
// avec heure. Séparé de `useToday()` (précision jour, 1 min) pour ne pas imposer ce rythme plus
// soutenu aux écrans qui n'ont besoin que du jour.
const REFRESH_INTERVAL_MS = 15_000

const now = ref<Moment>(moment())
let started = false

function refresh(): void {
  now.value = moment()
}

function ensureStarted(): void {
  if (started) return
  started = true

  setInterval(refresh, REFRESH_INTERVAL_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh()
  })
}

export function useNow(): { now: ComputedRef<Moment> } {
  ensureStarted()
  return { now: computed(() => now.value) }
}
