const invokeFilterErrorTypes = async (
  targetFunction,
  whiteListErrors,
  ...args
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
        (ErrorConstructor.name !== 'Error' &&
          ErrorConstructor.name != null &&
          ErrorConstructor.name === error.name)
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

export default invokeFilterErrorTypes
