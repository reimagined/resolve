import { MAX_DIMENSION_VALUE_LENGTH } from './constants'

export const getErrorMessage = (error: Error) => {
  let errorMessage = error.message.split(/\n|\r|\r\n/g)[0]

  if (errorMessage.length > MAX_DIMENSION_VALUE_LENGTH) {
    const messageEnd = '...'

    errorMessage = `${errorMessage.slice(
      0,
      MAX_DIMENSION_VALUE_LENGTH - messageEnd.length
    )}${messageEnd}`
  }

  return errorMessage
}
