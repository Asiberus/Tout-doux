import { computed, ComputedRef } from 'vue'
import { useDisplay } from 'vuetify'

interface UseDialogWidth {
  dialogWidth: ComputedRef<string | null>
  dialogFullscreen: ComputedRef<boolean>
  confirmDialogWidth: ComputedRef<string | null>
  confirmDialogFullscreen: ComputedRef<boolean>
}

export function useDialogWidth(): UseDialogWidth {
  const { xs, smAndDown, mdAndDown } = useDisplay()

  const dialogWidth = computed<string | null>(() => {
    if (smAndDown.value) return null // fullscreen
    if (mdAndDown.value) return '80%'
    return '60%'
  })

  const confirmDialogWidth = computed<string | null>(() => {
    if (xs.value) return null // fullscreen
    if (mdAndDown.value) return '70%'
    return '50%'
  })

  return {
    dialogWidth,
    dialogFullscreen: smAndDown,
    confirmDialogWidth,
    confirmDialogFullscreen: xs,
  }
}
