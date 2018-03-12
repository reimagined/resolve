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

  return `${rootDir}${path}`
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
  let promiseResolver = () => null
  const promise = new Promise(resolve => (promiseResolver = resolve))

  const result = arg => promiseResolver(arg)
  Object.setPrototypeOf(result, Promise.prototype)

  result.then = (onResolve, onReject) => promise.then(onResolve, onReject)
  result.catch = onReject => promise.catch(onReject)

  if (args.length === 1) {
    result(args[0])
  }

  return result
}
