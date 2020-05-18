const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

const prepare = async ({ directory, sourceType }) => {
  if (sourceType === 'ts') {
    const { stdout, stderr } = await exec(`npx tsc`, {
      cwd: directory,
      stdio: 'inherit'
    })
    if (stderr) {
      // eslint-disable-next-line no-console
      console.error(stderr)
    }
    if (stdout) {
      // eslint-disable-next-line no-console
      console.log(stdout)
    }
  }
}

module.exports = { prepare }
