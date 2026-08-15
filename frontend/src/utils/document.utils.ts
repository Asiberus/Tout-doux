export function hideScroll(): void {
  document.documentElement.classList.add('hide-scroll')
  document.documentElement.classList.add('overscroll-behavior-none')
}

export function showScroll(): void {
  document.documentElement.classList.remove('hide-scroll')
  document.documentElement.classList.remove('overscroll-behavior-none')
}
