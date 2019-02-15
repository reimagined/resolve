const checkInitErrors = ({ executors, errorMessages }) => {
  if (errorMessages.length > 0) {
    for (const executor of executors.values()) {
      executor.dispose()
    }
    throw new Error(errorMessages.join('\n'))
  }
}

export default checkInitErrors
