import { useDisplay } from 'vuetify'

export function getDialogWidth(): string | null {
  const display = useDisplay()

  // dialog is fullscreen
  if (display.smAndDown) return null
  else if (display.mdAndDown) return '80%'
  else return '60%'
}

export function getConfirmDialogWidth(): string | null {
  const display = useDisplay()

  // dialog is fullscreen
  if (display.xs) return null
  else if (display.mdAndDown) return '70%'
  else return '50%'
}
