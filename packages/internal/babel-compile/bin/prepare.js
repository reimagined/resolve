const { execSync } = require('child_process')

const tscPath = require.resolve('typescript/bin/tsc')

const prepare = async ({ directory, sourceType }) => {
  if (sourceType === 'ts') {
    try {
      execSync(`node "${tscPath}"`, { cwd: directory, stdio: 'inherit' })
    } catch (error) {
      throw Error('')
    }
  }
}

module.exports = { prepare }
