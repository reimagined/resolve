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

export function getRootableUrl(path) {
  let rootDir =
    typeof process !== 'undefined' &&
    typeof process.env !== 'undefined' &&
    process.env['ROOT_PATH']
      ? process.env['ROOT_PATH']
      : ''

  const isReactNative =
    typeof navigator !== 'undefined' && navigator.product === 'ReactNative'

  if (isReactNative && path === '/socket/') {
    rootDir = ''
  }

  let rootableUrl = rootDir
  if (!/\/$/.test(rootDir)) {
    rootableUrl += '/'
  }

  if (/^\//.test(path)) {
    rootableUrl += path.slice(1)
  } else {
    rootableUrl += path
  }

  return rootableUrl
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
