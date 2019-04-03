import respawn from 'respawn'

const errors = []
const processes = []

export const processFail = error => {
  errors.push(error)
}

export const processRegister = (command, opts) => {
  const process = respawn(command, opts)

  processes.push(process)

  return process
}

export const processStopAll = error => {
  if (error != null) {
    processes.push(error)
  }
  const promises = []
  for (const process of processes) {
    promises.push(
      new Promise(resolve => {
        process.stop(resolve)
      })
    )
  }
  processes.length = 0

  return Promise.all(promises).then(() => {
    let code = 0
    for (const error of errors) {
      code = 1
      // eslint-disable-next-line no-console
      console.error(error.message || error)
    }
    process.exit(code)
  })
}
