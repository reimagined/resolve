import path from 'path'
import { fork } from 'child_process'

export default function exec(cmd, env = {}) {
  return new Promise((resolve, reject) => {
    const modulePath = path.resolve(__dirname, '../bin/resolve-scripts.js')
    const args = cmd
      .replace('resolve-scripts', '')
      .trim()
      .split(' ')
    args.push('--print-config')
    const childProcess = fork(modulePath, args, { env, silent: true })

    let stdout = ''
    let stderr = ''

    childProcess.stdout.on('data', function(data) {
      stdout += `${data}\r\n`
    })

    childProcess.stderr.on('data', function(data) {
      stderr += `${data}\r\n`
    })

    childProcess.on('close', function(code) {
      try {
        if (code === 0) {
          return resolve(JSON.parse(stdout.trim()))
        }
      } catch (parseError) {
        // eslint-disable-next-line
        console.error(stdout)
        return reject(parseError)
      }
      return reject(stderr)
    })
  })
}
