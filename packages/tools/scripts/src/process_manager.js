import respawn from 'respawn'

const processes = []

export const processRegister = (command, opts) => {
  const process = respawn(command, opts)

  processes.push(process)

  return process
}

export const processStopAll = () => {
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

process.on('exit', processStopAll)
