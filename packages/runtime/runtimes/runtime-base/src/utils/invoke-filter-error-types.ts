// TODO: change arguments ordering
// TODO: improve types
export const invokeFilterErrorTypes = async (
  targetFunction: Function,
  whiteListErrors: any[],
  ...args: any[]
) => {
  if (!Array.isArray(whiteListErrors) || typeof targetFunction !== 'function') {
    throw new Error('InvokeFilterErrorTypes failed')
  }
  let result = null
  try {
    result = await targetFunction(...args)
  } catch (error) {
    let isFatal = true
    for (const ErrorConstructor of whiteListErrors) {
      if (
        error instanceof ErrorConstructor ||
        (typeof ErrorConstructor.is === 'function' &&
          ErrorConstructor.is(error))
      ) {
        isFatal = false
        break
      }
    }

    if (isFatal) {
      throw error
    } else {
      result = error
    }
  }

  return result
}
