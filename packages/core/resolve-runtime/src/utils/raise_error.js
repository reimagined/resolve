const raiseError = errorText => {
  resolveLog('error', 'Error: ', errorText)
  process.exit(1)
}

export default raiseError
