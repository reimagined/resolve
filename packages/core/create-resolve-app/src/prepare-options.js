const prepareOptions = async pool => {
  const { path, isYarnAvailable, messages, commandLineArgs } = pool

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

  const resolveVersion = process.env.__RESOLVE_VERSION__

  if (unknownCliArgs && unknownCliArgs.length > 0) {
    // eslint-disable-next-line no-console
    console.error(messages.unknownOptions(unknownCliArgs.join(' ')))
    process.exit(1)
  } else if (cliArgs.help) {
    // eslint-disable-next-line no-console
    console.log(messages.help)
    process.exit(0)
  } else if (cliArgs.version) {
    // eslint-disable-next-line no-console
    console.log(resolveVersion)
    process.exit(0)
  } else if (!cliArgs._unknown) {
    // eslint-disable-next-line no-console
    console.error(messages.emptyAppNameError)
    process.exit(1)
  } else {
    const applicationName = cliArgs._unknown[0]

    const exampleName = cliArgs.example || 'hello-world'

    const revision = cliArgs.branch
      ? cliArgs.branch
      : cliArgs.commit
      ? cliArgs.commit
      : 'master'

    const resolveCloneDirName = `resolve-${revision}`

    const resolveCloneExamplePath = path.join(
      process.cwd(),
      applicationName,
      resolveCloneDirName,
      'examples',
      exampleName
    )

    const resolveDownloadZipUrl = `https://codeload.github.com/reimagined/resolve/zip/${revision}`

    const resolveCloneZipPath = path.join(
      process.cwd(),
      applicationName,
      `${resolveCloneDirName}.zip`
    )

    const analyticsUrlBase = 'https://ga-beacon.appspot.com/UA-118635726-2'

    const useYarn = isYarnAvailable()

    Object.assign(pool, {
      resolveVersion,
      applicationName,
      exampleName,
      revision,
      resolveCloneDirName,
      resolveCloneExamplePath,
      resolveDownloadZipUrl,
      resolveCloneZipPath,
      analyticsUrlBase,
      useYarn
    })
  }
}

export default prepareOptions
