import moment, { Moment } from 'moment'
import { computed, ComputedRef, ref } from 'vue'

// Précision jour : suffisant pour tout ce qui ne compare que des jours (isToday, canGoForward...).
const REFRESH_INTERVAL_MS = 60_000

const now = ref<Moment>(moment())
let started = false

function refresh(): void {
  now.value = moment()
}

function ensureStarted(): void {
  if (started) return
  started = true

  setInterval(refresh, REFRESH_INTERVAL_MS)
  // Un onglet en arrière-plan peut voir son setInterval throttlé par le navigateur : on
  // rattrape au retour au premier plan plutôt que d'attendre le prochain tick.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh()
  })
}

export function useToday(): { today: ComputedRef<Moment> } {
  ensureStarted()
  return { today: computed(() => now.value) }
}
