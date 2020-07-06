const serializeError = error => {
  if (error == null) {
    return null
  }
  if (
    error.constructor === Object &&
    (error.code != null || error.message != null || error.stack != null)
  ) {
    return error
  }
  if (!(error instanceof Error)) {
    throw new Error(`The "${JSON.stringify(error)}" is not instance of Error`)
  } else {
    return {
      name: error.name,
      code: error.code,
      message: error.message,
      stack: error.stack
    }
  }
}

export default serializeError
