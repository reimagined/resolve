export function assertLeadingSlash(value: string, name?: string): void {
  if (!value?.startsWith('/')) {
    console.error(value)
    throw Error(`${name ?? 'the value'} must have leading "/"`)
  }
}

export function assertNonEmptyString(value: string, name?: string): void {
  if (!value || value === '' || value.trim() === '') {
    console.error(value)
    throw Error(`${name ?? 'the value'} should not be empty "/"`)
  }
}
