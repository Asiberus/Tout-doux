/**
 * Get value from HTML meta tag
 * @param {string} key
 */
export function getConfigValue(key: string): string | null {
  const node = document.querySelector(`meta[property=${key}]`)

  if (node) return node.getAttribute('content')
  return null
}
