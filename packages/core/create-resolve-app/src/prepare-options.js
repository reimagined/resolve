import {
  analyticsUrlBase,
  resolveVersion,
  resolvePackages,
  resolveExamples
} from './constants'

const prepareOptions = async pool => {
  const {
    path,
    console,
    process,
    commandLineArgs,
    isYarnAvailable,
    safeName,
    message
  } = pool

  const cliArgs = commandLineArgs(
    [
      { name: 'example', alias: 'e', type: String },
      { name: 'branch', alias: 'b', type: String },
      { name: 'commit', alias: 'c', type: String },
      { name: 'version', alias: 'V', type: Boolean },
      { name: 'help', alias: 'h', type: Boolean },
      { name: 'local-registry', type: Boolean }
    ],
    { partial: true }
  )

  const unknownCliArgs =
    cliArgs._unknown && cliArgs._unknown.filter(x => x.startsWith('-'))

  Object.assign(pool, {
    analyticsUrlBase,
    resolveVersion,
    resolvePackages,
    resolveExamples
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

    const revision = branch ? branch : commit ? commit : 'master'

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
      localRegistry
    })
  }
}

export default prepareOptions
