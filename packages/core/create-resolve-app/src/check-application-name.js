const checkApplicationName = ({
  EOL,
  chalk,
  validateProjectName,
  applicationName
}) => async () => {
  const result = validateProjectName(applicationName)
  if (!result.validForNewPackages) {
    let message = `It is impossible to create an application called ${chalk.red(
      `"${applicationName}"`
    )} because of npm naming restrictions:`

    message += []
      .concat(result.errors || [])
      .concat(result.warnings || [])
      .map(e => `  *  ${e}`)
      .join(EOL)

    throw message
  }
}

export default checkApplicationName
