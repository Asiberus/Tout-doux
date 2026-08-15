export function booleanSort(a: boolean, b: boolean): number {
  if (a && !b) return -1
  else if (!a && b) return 1
  else return 0
}
