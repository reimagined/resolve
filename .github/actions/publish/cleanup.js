const core = require('@actions/core')
const { execSync } = require('child_process')

const isTrue =
    str => str && ['yes', 'true', '1'].includes(str.toLowerCase())

if (isTrue(core.getInput('unpublish'))) {
  console.log('unpublishing packages')
}
