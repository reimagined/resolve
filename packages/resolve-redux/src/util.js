export function checkRequiredFields(obj, beforeWarnings, afterWarnings) {
  const warningMessages = Object.keys(obj)
    .map(
      fieldName =>
        obj[fieldName] ? null : `The '${fieldName}' field is required`
    )
    .filter(msg => msg)

  const shouldWarningsBePrinted = warningMessages.length > 0

  if (shouldWarningsBePrinted) {
    // eslint-disable-next-line no-console
    console.warn(
      [beforeWarnings, ...warningMessages, afterWarnings]
        .filter(line => line)
        .join('\n')
    )
  }

  return !shouldWarningsBePrinted
}

export function getKey(viewModel, aggregateId) {
  return `${viewModel}:${aggregateId}`
}

export function delay(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

export function makeLateResolvingPromise(...args) {
  if (args.length > 1) {
    throw new Error(
      'Make late-resolved promise accepts only zero on one argument'
    )
  }

  let resolvePromise = null
  const promise = new Promise(resolve => (resolvePromise = resolve))
  Object.defineProperty(promise, 'resolve', { value: resolvePromise })

  if (args.length === 1) {
    resolvePromise(args[0])
  }

  return promise
}
