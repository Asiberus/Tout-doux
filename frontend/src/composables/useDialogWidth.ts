import { computed, ComputedRef, Ref } from 'vue'
import { useDisplay } from 'vuetify'

interface UseDialogWidth {
  dialogWidth: ComputedRef<string | undefined>
  dialogFullscreen: Ref<boolean>
  confirmDialogWidth: ComputedRef<string | undefined>
  confirmDialogFullscreen: Ref<boolean>
}

export function useDialogWidth(): UseDialogWidth {
  const { xs, smAndDown, mdAndDown } = useDisplay()

  const dialogWidth = computed<string | undefined>(() => {
    if (smAndDown.value) return undefined // fullscreen
    if (mdAndDown.value) return '80%'
    return '60%'
  })

  const confirmDialogWidth = computed<string | undefined>(() => {
    if (xs.value) return undefined // fullscreen
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
