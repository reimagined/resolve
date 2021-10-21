import respawn from 'respawn'

const errors = []
const processes = []

export const processFail = (error) => {
  errors.push(error)
}

export const processRegister = (command, opts) => {
  console.log('register', command)
  const process = respawn(command, opts)

  processes.push(process)

  return process
}

export const processStopAll = (error) => {
  console.log('stop all', processes.length)
  if (error != null) {
    errors.push(error)
  }
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

  return Promise.all(promises).then(() => {
    let code = 0
    for (const error of errors) {
      code = 1
      // eslint-disable-next-line no-console
      console.error(error)
    }
    process.exit(code)
  })
}

process.on('SIGINT', processStopAll)
