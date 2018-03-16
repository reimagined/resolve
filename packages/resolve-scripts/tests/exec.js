import { exec as nativeExec } from 'child_process'

export default function exec(cmd, env = {}) {
  return new Promise((resolve, reject) => {
    nativeExec(
      cmd.replace('resolve-scripts', 'node bin/resolve-scripts.js') +
        ' --print-config',
      { env },
      (error, stdout) => {
        if (error) {
          reject(error)
        } else {
          try {
            resolve(JSON.parse(stdout))
          } catch (parseError) {
            // eslint-disable-next-line
            console.error(stdout)
            throw parseError
          }
        }
      }
    )
  })
}
