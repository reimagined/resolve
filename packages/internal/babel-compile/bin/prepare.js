const { unlinkSync } = require('fs')
const { execSync } = require('child_process')
const find = require('glob').sync

const prepare = async ({ directory, sourceType }) => {
  if (sourceType === 'ts') {
    for (const filePath of find('./**/*{.d.ts,.js,.js.map,.mjs,.mjs.map}', {
      cwd: directory,
      absolute: true
    })) {
      if (filePath.includes('node_modules')) {
        continue
      }
      unlinkSync(filePath)
    }

    execSync('tsc', { cwd: directory })
  }
}

module.exports = { prepare }
