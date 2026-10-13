export function hideScroll(): void {
  document.documentElement.classList.add('hide-scroll')
  document.documentElement.classList.add('overscroll-behavior-none')
}

export function showScroll(): void {
  document.documentElement.classList.remove('hide-scroll')
  document.documentElement.classList.remove('overscroll-behavior-none')
}

export function scrollParent(element: HTMLElement | undefined): HTMLElement | null {
  let parent = element?.parentElement
  while (parent) {
    const { overflowY } = getComputedStyle(parent)
    if (/(auto|scroll)/.test(overflowY) && parent.scrollHeight > parent.clientHeight) return parent
    parent = parent.parentElement
  }
  return document.scrollingElement as HTMLElement | null
}
