const pipePromisify = (inputStream, outputStream, status) => {
  let ended = false
  const end = () => {
    if (!ended) {
      ended = true
      if (typeof outputStream.close === 'function') {
        outputStream.close()
      }
      if (typeof inputStream.close === 'function') {
        inputStream.close()
      }
      return true
    }
    return false
  }
  return new Promise((resolve, reject) => {
    const finishHandler = () => {
      if (end()) {
        resolve(status)
      }
    }
    const errorHandler = error => {
      if (end()) {
        reject(error)
      }
    }
    inputStream.pipe(outputStream)
    inputStream.on('error', errorHandler)
    outputStream.on('finish', finishHandler)
    outputStream.on('end', finishHandler)
    outputStream.on('error', errorHandler)
  })
}

export default pipePromisify
