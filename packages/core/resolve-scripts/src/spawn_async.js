import { spawn } from 'child_process'

const spawnAsync = (command, args, options) =>
  new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, options)

    childProcess.on('close', code => {
      if (String(code) !== String(0)) {
        reject(String(''))
        return
      }
      resolve()
    })

    childProcess.on('error', error => {
      reject(error)
    })
  })

export default spawnAsync
