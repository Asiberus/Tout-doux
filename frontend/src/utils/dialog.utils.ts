import vuetify from '@/plugins/vuetify'

export function getDialogWidth(): string | null {
    const { breakpoint } = vuetify.framework

    // dialog is fullscreen
    if (breakpoint.smAndDown) return null
    else if (breakpoint.mdAndDown) return '80%'
    else return '60%'
}

export function getConfirmDialogWidth(): string | null {
    const { breakpoint } = vuetify.framework

    // dialog is fullscreen
    if (breakpoint.xsOnly) return null
    else if (breakpoint.mdAndDown) return '70%'
    else return '50%'
}
