export function assertNonEmptyString(value: string, name?: string): void {
  if (!value || value === '' || value.trim() === '') {
    // eslint-disable-next-line no-console
    console.error(value)
    throw Error(`${name ?? 'the value'} should not be empty "/"`)
  }
}
