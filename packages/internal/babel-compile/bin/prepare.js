const { execSync } = require('child_process')

const prepare = async ({ directory, sourceType }) => {
  if (sourceType === 'ts') {
    try {
      execSync(`npx tsc`, { cwd: directory, stdio: 'inherit' })
    } catch (error) {
      throw ''
    }
  }
}

module.exports = { prepare }
