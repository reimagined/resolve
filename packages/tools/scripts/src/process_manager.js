import respawn from 'respawn'

const processes = []

export const processRegister = (command, opts) => {
  const process = respawn(command, opts)

  processes.push(process)

  return process
}

const processStopAllListener = (code) => {
  void code
  const promises = []
  for (const process of processes) {
    promises.push(
      new Promise((resolve) => {
        if (process.stop) {
          process.stop(resolve)
        } else {
          resolve()
        }
      })
    )
  }
  processes.length = 0

  return Promise.all(promises)
}

export const processStopAll = (error) => {
  process.removeListener('exit', processStopAllListener)

  if (error != null) {
    // eslint-disable-next-line no-console
    console.error(error)
    if (process.exitCode === undefined || process.exitCode === 0)
      process.exitCode = 1
  }
  return processStopAllListener()
}

process.on('exit', processStopAllListener)
