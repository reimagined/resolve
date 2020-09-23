const core = require('@actions/core')
const { execSync } = require('child_process')
const path = require('path')

const isTrue = (str) => str && ['yes', 'true', '1'].includes(str.toLowerCase())

if (isTrue(core.getInput('unpublish'))) {
  const releaseVersion = core.getState('release_version')
  const releaseTag = core.getState('release_tag')

  console.log('removing packages from registry')

  const remover = path.resolve(process.cwd(), '.github/actions/publish/remover')

  execSync(`npx oao all "node ${remover} ${releaseVersion} ${releaseTag}"`, {
    stdio: 'inherit',
  })
}
