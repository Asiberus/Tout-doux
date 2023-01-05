export function hideScroll(): void {
    document.documentElement.classList.add('hide-scroll')
}

export function showScroll(): void {
    document.documentElement.classList.remove('hide-scroll')
}
