const { execSync } = require('child_process')
const core = require('@actions/core')
const os = require('os')
const fs = require('fs')
const path = require('path')

const isTrue = str => str && (str.toLowerCase() === 'true' || str.toLowerCase() === 'yes' || str.toLowerCase() === '1')

const readPackageJSON = () => JSON.parse(fs.readFileSync('./package.json').toString('utf-8'))

const getVersion = (seedOrVersion, releaseType) => {
  seedOrVersion = seedOrVersion || (new Date().toISOString()).replace(/[:.]/gi, '-')
  releaseType = releaseType || 'canary'
  if (releaseType === 'release') {
    return seedOrVersion === 'current' ? readPackageJSON().version : seedOrVersion
  }
  return `${readPackageJSON().version}-${releaseType}.${seedOrVersion}`
}

const writeNpmRc = (registry, token) => {
  if (!registry || !token) {
    throw Error(`wrong NPM registry settings`)
  }

  const npmRc = path.resolve(os.homedir(), '.npmrc')

  console.debug(`writing ${npmRc}`)
  fs.writeFileSync(npmRc,
    `//${registry}/:_authToken=${token}\n` +
    `//${registry}/:always-auth=true\n` +
    `registry=http://${registry}\n`
  )
}

try {
  writeNpmRc(core.getInput('npm_registry'), core.getInput('npm_token'))

  const version = core.getInput('version')
  const releaseType = core.getInput('release_type')
  const tag = core.getInput('tag')

  const releaseVersion = getVersion(version, releaseType)
  const publisher = path.resolve(process.cwd(), '.github/actions/publish/publisher')

  console.log('publishing the monorepo')

  execSync(`npx oao all "node ${publisher} ${releaseVersion} ${tag}"`, {
    stdio: 'inherit'
  })

  console.log('done')
} catch (error) {
  core.setFailed(error)
}
