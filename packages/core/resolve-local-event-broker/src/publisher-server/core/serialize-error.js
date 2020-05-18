import { SERIALIZED_ERROR_SYMBOL } from '../constants'

const serializeError = error => {
  if (error != null && error[SERIALIZED_ERROR_SYMBOL] != null) {
    return error
  } else if (error == null || !(error instanceof Error)) {
    throw new Error(`The "${error}" is not instance of Error`)
  } else {
    return {
      [SERIALIZED_ERROR_SYMBOL]: true,
      code: error.code,
      message: error.message,
      stack: error.stack
    }
  }
}

export default serializeError
