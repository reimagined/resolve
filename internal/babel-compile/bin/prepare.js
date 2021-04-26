const { exec: execCallback } = require('child_process')

const configFile = 'tsconfig.prod.json'

const exec = (cmd, opts = {}) =>
  new Promise((resolve, reject) => {
    const child = execCallback(cmd, opts, (err) =>
      err ? reject('') : resolve()
    )

    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
  })

const prepare = async ({ directory, sourceType }) => {
  if (sourceType === 'ts') {
    try {
      return exec(`tsc --build ${configFile}`, {
        cwd: directory,
      })
    } catch (error) {
      throw Error('')
    }
  }
}

module.exports = { prepare }
