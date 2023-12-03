import vuetify from '@/plugins/vuetify'

export function getDialogWidth(): string | null {
    const { breakpoint } = vuetify.framework

    // dialog is fullscreen
    if (breakpoint.smAndDown) return null
    else if (breakpoint.mdAndDown) return '80%'
    else return '60%'
}
