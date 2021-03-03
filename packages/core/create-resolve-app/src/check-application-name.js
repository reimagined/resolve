const checkApplicationName = (pool) => async () => {
  const { EOL, chalk, validateProjectName, applicationName } = pool
  const result = validateProjectName(applicationName)
  if (!result.validForNewPackages) {
    let message = `It is impossible to create an application called ${chalk.red(
      `"${applicationName}"`
    )} due to npm naming restrictions:`

    message += []
      .concat(result.errors || [])
      .concat(result.warnings || [])
      .map((e) => `  *  ${e}`)
      .join(EOL)

    throw message
  }
}

export default checkApplicationName
