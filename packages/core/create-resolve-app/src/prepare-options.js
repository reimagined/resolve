import {
  analyticsUrlBase,
  resolveVersion,
  resolvePackages,
  resolveExamples,
} from './constants'

const prepareOptions = async (pool) => {
  const {
    path,
    console,
    process,
    commandLineArgs,
    isYarnAvailable,
    safeName,
    message,
    https,
  } = pool

  const cliArgs = commandLineArgs(
    [
      { name: 'example', alias: 'e', type: String },
      { name: 'branch', alias: 'b', type: String },
      { name: 'commit', alias: 'c', type: String },
      { name: 'version', alias: 'V', type: Boolean },
      { name: 'help', alias: 'h', type: Boolean },
      { name: 'local-registry', type: Boolean },
    ],
    { partial: true }
  )

  const unknownCliArgs =
    cliArgs._unknown && cliArgs._unknown.filter((x) => x.startsWith('-'))

  Object.assign(pool, {
    analyticsUrlBase,
    resolveVersion,
    resolvePackages,
    resolveExamples,
  })

  if (unknownCliArgs && unknownCliArgs.length > 0) {
    console.error(message.unknownOptions(pool, unknownCliArgs))
    return process.exit(1)
  } else if (cliArgs.help) {
    console.log(message.help(pool))
    return process.exit(0)
  } else if (cliArgs.version) {
    console.log(resolveVersion)
    return process.exit(0)
  } else if (!cliArgs._unknown) {
    // eslint-disable-next-line no-console
    console.error(message.emptyAppNameError(pool))
    return process.exit(1)
  } else {
    const applicationName = cliArgs._unknown[0]

    const { commit, branch, example: exampleName = 'hello-world' } = cliArgs

    const revision = branch ? branch : commit ? commit : `V${resolveVersion}`

    const resolveCloneDirName = `resolve-${safeName(revision)}`

    const applicationPath = path.join(process.cwd(), applicationName)
    const applicationPackageJsonPath = path.join(
      process.cwd(),
      applicationName,
      'package.json'
    )

    const resolveClonePath = path.join(applicationPath, resolveCloneDirName)
    const resolveCloneExamplesPath = path.join(resolveClonePath, 'examples')
    const resolveCloneExamplePath = path.join(
      resolveCloneExamplesPath,
      exampleName
    )

    const resolveDownloadZipUrl = `https://codeload.github.com/reimagined/resolve/zip/${revision}`

    const resolveCloneZipPath = path.join(
      applicationPath,
      `${resolveCloneDirName}.zip`
    )

    const useYarn = isYarnAvailable(pool)()
    const localRegistry = cliArgs['local-registry']

    Object.assign(pool, {
      applicationName,
      commit,
      branch,
      exampleName,
      revision,
      resolveCloneDirName,
      applicationPath,
      applicationPackageJsonPath,
      resolveClonePath,
      resolveCloneExamplesPath,
      resolveCloneExamplePath,
      resolveDownloadZipUrl,
      resolveCloneZipPath,
      useYarn,
      localRegistry,
    })

    const masterBranchVersionJsonUrl =
      'https://raw.githubusercontent.com/reimagined/resolve/master/packages/core/create-resolve-app/package.json'
    const masterBranchVersion = await new Promise((resolve) => {
      let responseString = ''
      https.get(masterBranchVersionJsonUrl, (response) => {
        response.on('data', (data) => (responseString += data.toString()))
        response.on('end', () =>
          Promise.resolve()
            .then(() => JSON.parse(responseString).version)
            .catch(() => null)
            .then(resolve)
        )
        response.on('error', () => resolve(null))
      })
    })

    if (
      masterBranchVersion != null &&
      masterBranchVersion !== resolveVersion &&
      branch == null &&
      commit == null
    ) {
      console.warn(
        `You are using create-resolve-app version ${resolveVersion}, but actual one is ${masterBranchVersion}`
      )
      console.warn(
        `Most likely you have package globally installed in npm or yarn, which is highly discouraged`
      )
      console.warn(
        `Run "npm uninstall -g create-resolve-app" or "yarn global remove create-resolve-app" in console`
      )
    }
  }
}

export default prepareOptions
