const { execSync } = require('child_process')
const core = require('@actions/core')
const os = require('os')
const fs = require('fs')
const path = require('path')

const readPackageJSON = () =>
  JSON.parse(fs.readFileSync('./package.json').toString('utf-8'))

const getVersion = (seedOrVersion, releaseType) => {
  seedOrVersion =
    seedOrVersion || new Date().toISOString().replace(/[:.]/gi, '-')
  releaseType = releaseType || 'canary'
  if (releaseType === 'release') {
    return seedOrVersion === 'current'
      ? readPackageJSON().version
      : seedOrVersion
  }
  return `${readPackageJSON().version}-${releaseType}.${seedOrVersion}`
}

const writeNpmRc = (registry, token, file) => {
  if (!registry || !token) {
    throw Error(`wrong NPM registry settings`)
  }

  console.debug(`writing ${file}`)
  fs.writeFileSync(
    file,
    `//${registry}/:_authToken=${token}\n` +
      `//${registry}/:always-auth=true\n` +
      `registry=http://${registry}\n`
  )
}

try {
  const npmRc = path.resolve('./', '.npmrc')

  writeNpmRc(core.getInput('npm_registry'), core.getInput('npm_token'), npmRc)

  core.saveState('npm_rc_file', npmRc)

  const version = core.getInput('version')
  const releaseType = core.getInput('release_type')
  const tag = core.getInput('tag')

  const releaseVersion = getVersion(version, releaseType)
  const publisher = path.resolve(
    process.cwd(),
    '.github/actions/publish/publisher'
  )

  console.log('publishing the monorepo')

  core.saveState('release_version', releaseVersion)
  core.saveState('release_tag', tag)

  execSync(`npx oao all "node ${publisher} ${releaseVersion} ${tag}"`, {
    stdio: 'inherit',
  })

  core.setOutput('release_version', releaseVersion)
  core.setOutput('release_tag', tag)

  console.log('done')
} catch (error) {
  core.setFailed(error)
}
