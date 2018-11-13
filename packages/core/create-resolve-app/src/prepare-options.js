const prepareOptions = async pool => {
  const {
    path,
    console,
    process,
    commandLineArgs,
    isYarnAvailable,
    message
  } = pool

  const cliArgs = commandLineArgs(
    [
      { name: 'example', alias: 'e', type: String },
      { name: 'branch', alias: 'b', type: String },
      { name: 'commit', alias: 'c', type: String },
      { name: 'version', alias: 'V', type: Boolean },
      { name: 'help', alias: 'h', type: Boolean }
    ],
    { partial: true }
  )

  const unknownCliArgs =
    cliArgs._unknown && cliArgs._unknown.filter(x => x.startsWith('-'))

  const analyticsUrlBase = 'https://ga-beacon.appspot.com/UA-118635726-2'
  const resolveVersion = process.env.__RESOLVE_VERSION__
  const resolvePackages = JSON.parse(process.env.__RESOLVE_PACKAGES__)
  const resolveExamples = JSON.parse(process.env.__RESOLVE_EXAMPLES__)

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

    const resolveCloneDirName = `resolve-${revision}`

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

    const useYarn = isYarnAvailable(pool)

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
      useYarn
    })
  }
}

export default prepareOptions
