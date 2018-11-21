const pipeline = pool => {
  const {
    chalk,
    console,
    process,
    prepareOptions,
    startCreatingApplication,
    checkApplicationName,
    downloadResolveRepo,
    testExampleExists,
    moveExample,
    patchPackageJson,
    install,
    printFinishOutput,
    sendAnalytics
  } = pool

  prepareOptions(pool)
    .then(startCreatingApplication(pool))
    .then(checkApplicationName(pool))
    .then(downloadResolveRepo(pool))
    .then(testExampleExists(pool))
    .then(moveExample(pool))
    .then(patchPackageJson(pool))
    .then(install(pool))
    .then(printFinishOutput(pool))
    .then(sendAnalytics(pool))
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error(chalk.red(error))
      process.exit(1)
    })
}

export default pipeline
