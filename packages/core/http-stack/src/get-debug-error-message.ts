const getDebugErrorMessage = (error: Error) => {
  return error?.stack != null ? `${error.stack}` : `Unknown error ${error}`
}

export default getDebugErrorMessage
