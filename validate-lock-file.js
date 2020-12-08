const fs = require('fs')
const path = require('path')
const url = require('url')
const lockfile = require('@yarnpkg/lockfile')
const { execSync } = require('child_process')
const os = require('os')

const errorsSymbol = Symbol('errors')
const resolveCloudCLIPackage = 'resolve-cloud'

const determineLatestCloudCLIVersion = () =>
  execSync(`yarn info ${resolveCloudCLIPackage} version --silent`)
    .toString()
    .replace(os.EOL, '')

const packageRegistryShouldBeGlobal = (entry) => {
  const { resolved, [errorsSymbol]: errors } = entry
  const link = url.parse(resolved)
  if (link.host !== 'registry.yarnpkg.com') {
    errors.push(
      `package registry should be 'registry.yarnpkg.com' but locked to ${link.host}`
    )
  }
  return entry
}

const resolveCloudShouldBeLatest = (latestVersion) => (entry) => {
  if (entry.name.startsWith('resolve-cloud@')) {
    if (entry.version !== latestVersion) {
      entry[errorsSymbol].push(
        Error(
          `package locked to outdated version ${entry.version} and should be upgraded to ${latestVersion}`
        )
      )
    }
  }
  return entry
}

const mapYarnLockEntries = (...callbacks) => {
  const contents = fs.readFileSync(path.resolve('yarn.lock'), 'utf-8')
  const yarnLock = lockfile.parse(contents)
  return Object.keys(yarnLock.object).map((key) => {
    const entry = {
      ...yarnLock.object[key],
      name: key,
      [errorsSymbol]: [],
    }
    callbacks.map((cb) => cb(entry))
    return entry
  })
}

try {
  const errors = mapYarnLockEntries(
    packageRegistryShouldBeGlobal,
    resolveCloudShouldBeLatest(determineLatestCloudCLIVersion())
  ).reduce((output, entry) => {
    entry[errorsSymbol].map((error) => output.push(`[${entry.name}]: ${error}`))
    return output
  }, [])
  if (errors.length) {
    // eslint-disable-next-line
    errors.map((error) => console.error(error))
    process.exit(1)
  }
} catch (error) {
  // eslint-disable-next-line
  console.error(error.message)
  process.exit(1)
}
