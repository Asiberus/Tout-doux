/**
 * Get value from HTML meta tag
 * @param {string} key
 */
export function getConfigValue(key: string): string | undefined {
  const node = document.querySelector(`meta[property=${key}]`)

  if (node) return node.getAttribute('content') ?? undefined
  return undefined
}
